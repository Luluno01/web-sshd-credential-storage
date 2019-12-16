import Credential from '../models/Credential'
import * as yargs from 'yargs'
import { readline, isYes } from './helpers/readline'


async function main() {
  const { id, group, help } = yargs
    .option('id', {
      alias: 'i',
      type: 'string',
      description: 'ID of credential to delete',
      demandOption: false
    })
    .array('id')
    .option('group', {
      alias: 'g',
      type: 'string',
      description: 'Delete the whole group',
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
  let credentials: Credential[]
  if(id) {
    const _credentials: Credential[] = (await Promise.all(id.map(_id => Credential.findByPk(_id))))
    id.forEach((_id, index) => {
      if(!_credentials[index]) console.warn('Credential with ID', _id, 'not found')
    })
    credentials = _credentials.filter(credential => credential != null)
    if(!credentials.length) {
      console.log('No credentials found')
      return
    }
  } else if(typeof group == 'string') {
    credentials = await Credential.findAll({ where: { group: group || null } })
    if(!credentials.length) {
      console.log('No matching group')
      return
    }
  } else {
    yargs.showHelp()
    process.exit(1)
  }
  console.table(credentials.map(credential => credential.toJSON()))
  const answer = await readline(`Are you sure you want to delete ${credentials.length} credential(s)? `)
  if(isYes(answer)) {
    await Promise.all(credentials.map(credential => credential.destroy()))
    console.log('Credential(s) deleted')
  } else {
    console.log('Aborted')
  }
}

main()
