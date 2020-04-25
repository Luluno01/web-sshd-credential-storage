import { pbkdf2 as _pbkdf2, createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { promisify } from 'util'
const pbkdf2 = promisify(_pbkdf2)
import * as assert from 'assert'
import { Model, DataTypes, CreateOptions, BulkCreateOptions } from 'sequelize'
import sequelize from './db'


export interface CredentialData {
  /**
   * Credential or server name
   */
  name: string
  /**
   * Server URI, e.g. https://example.com/ssh
   */
  uri: string
  /**
   * User name for target server
   */
  username: string
  /**
   * Password for target server
   */
  password: string
  /**
   * Group name of this credential
   */
  group: string | null
}

export default class Credential extends Model {
  public id!: number
  /**
   * Credential or server name
   */
  public name!: string
  /**
   * Salt for PBKDF2
   */
  public salt!: Buffer
  /**
   * Initial vector for AES
   */
  public iv!: Buffer

  /**
   * Encrypted credential data
   */
  public data!: Buffer
  /**
   * Group name of this credential
   */
  public group!: string | null

  // timestamps
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  public static associations: {}

  public async getDecryptedData(password: string | Buffer) {
    assert(password && (typeof password == 'string' || password instanceof Buffer), 'Password must be a non-empty string or buffer')
    const key = await pbkdf2(password, this.salt, 100000, 32 /* 256 / 8 = 32 */, 'sha512')
    const decipher = createDecipheriv('aes-256-gcm', key, this.iv)
    return JSON.parse(decipher.update(this.data).toString()) as Omit<CredentialData, 'name' | 'group'>
  }

  protected static async getEncryptedData({ name, uri, username, password, group }: CredentialData, cipherKey: string) {
    const salt = randomBytes(16)
    const iv = randomBytes(16)
    const key = await pbkdf2(cipherKey, salt, 100000, 32 /* 256 / 8 = 32 */, 'sha512')
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    return {
      name,
      salt,
      iv,
      data: cipher.update(JSON.stringify({ uri, username, password })),
      group
    }
  }

  public static async createEncrypted(credential: CredentialData, password: string, options?: CreateOptions & { returning: boolean }) {
    return await Credential.create(await Credential.getEncryptedData(credential, password), options)
  }

  public static async bulkCreateEncrypted(credentials: CredentialData[], password: string, options?: BulkCreateOptions) {
    return await Credential.bulkCreate(
      await Promise.all(credentials.map(credential => Credential.getEncryptedData(credential, password))),
      options
    )
  }

  public async setDataEncrypted(credential: CredentialData, password: string) {
    const { name, salt, iv, data, group } = await Credential.getEncryptedData(credential, password)
    this.name = name
    this.salt = salt
    this.iv = iv
    this.data = data
    this.group = group
    return this
  }

  public async toDecryptedJSON(password: string | Buffer, withSecret = false) {
    const data = (await this.getDecryptedData(password)) as CredentialData & { id: number, createdAt: Date, updatedAt: Date }
    data.id = this.id
    data.name = this.name
    data.group = this.group
    data.createdAt = this.createdAt
    data.updatedAt = this.updatedAt
    if (withSecret) return data
    else {
      delete data.username
      delete data.password
      return data
    }
  }
}

Credential.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  data: {
    type: new DataTypes.BLOB,
    allowNull: false,
  },
  salt: {
    type: new DataTypes.BLOB('tiny'),
    allowNull: false
  },
  iv: {
    type: new DataTypes.BLOB('tiny'),
    allowNull: false,
  },
  group: {
    type: new DataTypes.STRING(128),
    allowNull: true
  }
}, {
  sequelize
})

export async function sync() {
  // await Credential.sync({ force: true })  // This is done in ./index.ts
}
