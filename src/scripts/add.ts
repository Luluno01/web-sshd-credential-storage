import Credential, { CredentialData } from '../models/Credential'
import * as yargs from 'yargs'
import { readFile as _readFile } from 'fs'
import { promisify } from 'util'
import { readline } from './helpers/readline'
import sequelize from '../models/db'
const readFile = promisify(_readFile)


async function main() {
  process.once('beforeExit', () => sequelize.close())
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
    const credentials: CredentialData[] = JSON.parse((await readFile(file)).toString())
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
    const cipherKey = await readline('Encryption password: ')
    if (!cipherKey) {
      console.log('Password for encryption is required to add new credentials')
      process.exit(1)
    }
    if (!(await Credential.sentinelVerify(cipherKey))) {
      console.log('Password does not match password of sentinel credential')
      process.exit(1)
    }
    const created = await Credential.bulkCreateEncrypted(credentials, cipherKey)
    console.log(created.length, 'credential(s) added')
    if(created.length) console.table(created.map(credential => {
      return {
        id: credential.id,
        name: credential.name,
        group: credential.group,
        createdAt: credential.createdAt
      }
    }))
  } else if(name && uri && username && password) {
    const cipherKey = await readline('Encryption password: ')
    if (!cipherKey) {
      console.log('Password for encryption is required to add a new credential')
      process.exit(1)
    }
    if (!(await Credential.sentinelVerify(cipherKey))) {
      console.log('Password does not match password of sentinel credential')
      process.exit(1)
    }
    await Credential.createEncrypted({
      name,
      uri,
      username,
      password,
      group: (group && typeof group == 'string') ? group : null
    }, cipherKey)
    console.log('Credential created')
  } else {
    yargs.showHelp()
    process.exit(1)
  }
}

main()
