import Credential from '../models/Credential'
import * as yargs from 'yargs'
import { readline, isYes } from './helpers/readline'


async function main() {
  const { id, uri, name, username, password, group, help } = yargs
    .option('id', {
      alias: 'i',
      type: 'string',
      description: 'ID of credential to update',
      demandOption: true
    })
    .option('uri', {
      alias: 'U',
      type: 'string',
      description: 'Target URI',
      demandOption: false
    })
    .option('name', {
      alias: 'n',
      type: 'string',
      description: 'Name of this credential',
      demandOption: false
    })
    .option('username', {
      alias: 'u',
      type: 'string',
      description: 'User name',
      demandOption: false
    })
    .option('password', {
      alias: 'p',
      type: 'string',
      description: 'Password',
      demandOption: false
    })
    .option('group', {
      alias: 'g',
      type: 'string',
      description: 'Group name',
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
  if(id) {
    const credential = await Credential.findByPk(id)
    if(!credential) {
      console.log('Credential not found')
      return
    }
    const oldInfo: Partial<Credential> = { id: credential.id }
    const updateInfo: Partial<Credential> = { id: credential.id }
    if(typeof uri == 'string') {
      updateInfo.uri = uri
      oldInfo.uri = credential.uri
    }
    if(typeof name == 'string') {
      oldInfo.name = credential.name
      credential.name = updateInfo.name = name
    }
    if(typeof username == 'string') {
      oldInfo.username = credential.username
      credential.username = updateInfo.username = username
    }
    if(typeof password == 'string') {
      oldInfo.password = credential.password
      credential.password = updateInfo.password = password
    }
    if(typeof group == 'string') {
      oldInfo.group = credential.group
      credential.group = updateInfo.group = group || null
    }
    console.table({ old: oldInfo, new: updateInfo })
    const answer = await readline('Is the infomation above correct? ')
    if(isYes(answer)) {
      await credential.save()
      console.log('Credential updated')
    } else {
      console.log('Aborted')
    }
  } else {
    yargs.showHelp()
    process.exit(1)
  }
}

main()
