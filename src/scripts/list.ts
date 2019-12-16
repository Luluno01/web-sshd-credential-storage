import Credential from '../models/Credential'
import * as yargs from 'yargs'
import { FindOptions } from 'sequelize/types'


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
  if(group) {
    options.where = { group }
  }
  const credentials = (await Credential.findAll(options)).map(credential => credential.toJSON(withSecret))
  if(credentials.length) console.table(credentials)
  else console.log('[No credentials found]')
}

main()
