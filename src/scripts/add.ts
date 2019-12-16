import Credential from '../models/Credential'
import * as yargs from 'yargs'
import { readFile as _readFile } from 'fs'
import { promisify } from 'util'
const readFile = promisify(_readFile)


async function main() {
  const { file, uri, name, username, password, group, help } = yargs
    .option('file', {
      alias: 'f',
      type: 'string',
      description: 'Input json file',
      demandOption: false
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
  if(file) {
    console.log('Input file:', file)
    const credentials: Credential[] = JSON.parse((await readFile(file)).toString())
    if(!(credentials instanceof Array)) {
      console.error('Invalid input file')
      console.error(`Valid example:
[
  {
    "name": "My Server 1",
    "uri": "https://example.com/ssh",
    "username": "websshd",
    "password": "websshd-SeCreT",
    "group": null
  },
  {
    "name": "My Server 2",
    "uri": "https://example2.com/ssh",
    "username": "websshd",
    "password": "websshd-SeCreT",
    "group": "My Group 1"
  }
]`)
      process.exit(1)
    }
    const created = await Credential.bulkCreate(credentials)
    console.log(created.length, 'credential(s) added')
    if(created.length) console.table(created.map(credential => credential.toJSON()))
  } else if(name && uri && username && password) {
    await Credential.create({
      name,
      uri,
      username,
      password,
      group: (group && typeof group == 'string') ? group : null
    })
    console.log('Credential created')
  } else {
    yargs.showHelp()
    process.exit(1)
  }
}

main()
