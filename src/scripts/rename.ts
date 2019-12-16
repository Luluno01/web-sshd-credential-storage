import Credential from '../models/Credential'
import * as yargs from 'yargs'
import { readline, isYes } from './helpers/readline'


async function main() {
  const { old: _old, new: _newName, help } = yargs
    .option('old', {
      alias: 'o',
      type: 'string',
      description: 'Name of the group to rename',
      demandOption: true
    })
    .option('new', {
      alias: 'n',
      type: 'string',
      description: 'New name of the group',
      demandOption: true
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
  if(typeof _old != 'string' || typeof _newName != 'string') {
    yargs.showHelp()
    process.exit(1)
  }
  const old = _old || null
  const newName = _newName || null
  const credentials = await Credential.findAll({ where: { group: old } })
  if(!credentials.length) {
    console.log('No matching group')
    return
  }
  console.table(credentials.map(credential => credential.toJSON()))
  const answer = await readline(`Are you sure you want to rename group ${old} to ${newName} for the above credential(s)? `)
  if(isYes(answer)) {
    for(const credential of credentials) {
      credential.group = newName
    }
    await Promise.all(credentials.map(credential => credential.save()))
    console.log('Group renamed')
  } else {
    console.log('Aborted')
  }
}

main()
