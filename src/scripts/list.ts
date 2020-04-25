import Credential from '../models/Credential'
import * as yargs from 'yargs'
import { FindOptions } from 'sequelize/types'
import { readline } from './helpers/readline'


async function main() {
  const { 'with-secret': withSecret, group, help } = yargs
    .option('with-secret', {
      alias: 'w',
      type: 'boolean',
      description: 'Output username and password',
      default: false
    })
    .option('group', {
      alias: 'g',
      type: 'string',
      description: 'List this group only',
      demandOption: false
    })
    .option('help', {
      alias: 'h',
      type: 'boolean',
      description: 'Show help message',
      default: false
    }).argv
  if(help) {
    yargs.showHelp()
    process.exit(0)
  }
  const options: FindOptions = {}
  if (typeof group == 'string') {
    options.where = { group: group || null }
  }
  const fails: (Pick<Credential, 'id' | 'name' | 'group'> & { createdAt: Date, updatedAt: Date })[] = []
  const _credentials = await Credential.findAll(options)
  if (!_credentials.length) {
    console.log('[No credentials found]')
    return
  }
  const cipherKey = await readline('Encryption password: ')
  if (!cipherKey) {
    console.log('Password for encryption is required to list credential details')
    process.exit(1)
  }
  const credentials = (await Promise.all(_credentials.map(async credential => {
    try {
      return await credential.toDecryptedJSON(cipherKey, withSecret)
    } catch (err) {
      fails.push({
        id: credential.id,
        name: credential.name,
        group: credential.group,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt
      })
      return null
    }
  }))).filter(credential => !!credential)
  if (fails.length) {
    console.warn('The following credential cannot be decrypted')
    console.table(fails, [ 'id', 'name', 'group', 'createdAt', 'updatedAt' ])
  }
  if(credentials.length) console.table(
    credentials,
    withSecret ?
      [ 'id', 'name', 'uri', 'username', 'password', 'group', 'createdAt', 'updatedAt' ] :
      [ 'id', 'name', 'uri', 'group', 'createdAt', 'updatedAt' ]
  )
  else console.log('[No decrypted credentials can be listed]')
}

main()
