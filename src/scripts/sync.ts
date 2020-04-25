import { sync } from '../models'
import Credential from '../models/Credential'
import { readline } from './helpers/readline'
import sequelize from '../models/db'


async function main() {
  await sync()
  const password = await readline('Please enter password for encryption: ')
  if (!password) {
    console.error('Password is required to initialize the database')
    process.exit(1)
  }
  await Credential.createEncrypted({
    id: 1,
    name: '<sentinel>',
    uri: '<sentinel>',
    username: '<sentinel>',
    password: '<sentinel>',
    group: '<sentinel>'
  }, password, { returning: true })
  const sentinel = await Credential.findByPk(1)
  if (!sentinel || sentinel.name != '<sentinel>') {
    console.error('Cannot create proper sentinel credential, please consider change your database')
    process.exit(1)
  }
  console.log('Sentinel credential created')
  sequelize.close()
}

main()
