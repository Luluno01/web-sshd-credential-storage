import Credential, { CredentialData } from '../models/Credential'
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
    const cipherKey = await readline('Encryption password: ')
    if (!cipherKey) {
      console.log('Password for decryption is required to make an update')
      process.exit(1)
    }
    const credential = await Credential.findByPk(id)
    if(!credential) {
      console.log('Credential not found')
      return
    }
    let credentialData: CredentialData
    try {
      credentialData = (await credential.getDecryptedData(cipherKey)) as CredentialData
    } catch (err) {
      console.log('Failed to decrypt credential, please check your password')
      process.exit(1)
    }
    credentialData.name = credential.name
    credentialData.group = credential.group
    const oldInfo: Partial<CredentialData & { id: number }> = { id: credential.id }
    const updateInfo: Partial<CredentialData & { id: number }> = { id: credential.id }
    if(typeof uri == 'string') {
      updateInfo.uri = uri
      oldInfo.uri = credentialData.uri
    }
    if(typeof name == 'string') {
      oldInfo.name = credentialData.name
      credentialData.name = updateInfo.name = name
    }
    if(typeof username == 'string') {
      oldInfo.username = credentialData.username
      credentialData.username = updateInfo.username = username
    }
    if(typeof password == 'string') {
      oldInfo.password = credentialData.password
      credentialData.password = updateInfo.password = password
    }
    if(typeof group == 'string') {
      oldInfo.group = credentialData.group
      credentialData.group = updateInfo.group = group || null
    }
    console.table({ old: oldInfo, new: updateInfo })
    const answer = await readline('Is the information above correct? ')
    if(isYes(answer)) {
      await credential.setDataEncrypted(credentialData, cipherKey)
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
