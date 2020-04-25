import Credential, { CredentialData } from '../models/Credential'
import * as yargs from 'yargs'
import { readline, isYes } from './helpers/readline'
import sequelize from '../models/db'


async function main() {
  process.once('beforeExit', () => sequelize.close())
  const { id, group, force, help } = yargs
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
    .option('force', {
      alias: 'f',
      type: 'boolean',
      description: 'Force delete',
      demandOption: false,
      default: false
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
  /**
   * Credentials that failed to be decrypted and thus will not be delete unless `force` is set
   */
  const fails: Credential[] = []
  /**
   * Credentials to be deleted
   */
  const credentials: { credential: Credential, data: CredentialData & { id: number, createdAt: Date, updatedAt: Date } }[] = []
  let candidates: Credential[]
  if (id) {
    if (id.includes('1')) {
      console.warn('Sentinel credential cannot be deleted')
      id.splice(id.indexOf('1'), 1)
    }
    candidates = (await Promise.all(id.map(_id => Credential.findByPk(_id))))
    id.forEach((_id, index) => {
      if(!candidates[index]) console.warn('Credential with ID', _id, 'not found')
    })
    candidates = candidates.filter(credential => !!credential)
    if (candidates.length == 0) {
      console.log('No credentials can be delete')
      return
    }
  } else if(typeof group == 'string') {
    candidates = await Credential.findAll({ where: { group: group || null } })
    if (!candidates.length) {
      console.log('No matching group')
      return
    }
  } else {
    yargs.showHelp()
    process.exit(1)
  }
  let cipherKey: string
  if (!force) {
    cipherKey = await readline('Encryption password: ')
    if (!cipherKey) {
      console.log('Password for encryption is required to delete credentials')
      process.exit(1)
    }
  }
  if (cipherKey) {
    for (const credential of candidates) {
      try {
        credentials.push({ credential, data: await credential.toDecryptedJSON(cipherKey, true) })
      } catch (err) {
        fails.push(credential)
      }
    }
  } else if (force) {
    fails.splice(0, 0, ...candidates)  // No password provided, hence failed
  } else throw new Error('Password is falsy, however, `force` is not enabled')
  const toBeDeleted: Credential[] = []
  if (fails.length) {
    if (!force) {
      console.log('The following credential(s) failed to be decrypted and WILL NOT be deleted')
    } else {
      console.log('The following credential(s) WILL be FORCE deleted')
      toBeDeleted.splice(0, 0, ...fails)
    }
    console.table(fails.map(credential => {
      return {
        id: credential.id,
        name: credential.name,
        group: credential.group,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt
      }
    }), [ 'id', 'name', 'group', 'createdAt', 'updatedAt' ])
  }
  if (credentials.length) {
    console.log('The following credential(s) WILL be deleted')
    console.table(credentials.map(({ data }) => data), [ 'id', 'name', 'uri', 'username', 'password', 'group', 'createdAt', 'updatedAt' ])
    toBeDeleted.splice(0, 0, ...credentials.map(({ credential }) => credential))
  }
  if (toBeDeleted.length == 0) {
    console.log('No credentials can be delete')
    return
  }
  const answer = await readline(`Are you sure you want to delete ${toBeDeleted.length} credential(s)? `)
  if(isYes(answer)) {
    await Promise.all(toBeDeleted.map(credential => credential.destroy()))
    console.log('Credential(s) deleted')
  } else {
    console.log('Aborted')
  }
}

main()
