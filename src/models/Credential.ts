import { Model, DataTypes } from 'sequelize'
import sequelize from './db'


export default class Credential extends Model {
  public id!: number
  /**
   * Credential or server name
   */
  public name!: string
  /**
   * Server URI, e.g. https://example.com/ssh
   */
  public uri!: string
  /**
   * User name for target server
   */
  public username!: string
  /**
   * Password for target server
   */
  public password!: string
  /**
   * Group name of this credential
   */
  public group!: string | null

  // timestamps
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  public static associations: {}

  public toJSON(withSecret: boolean = false) {
    const json = super.toJSON() as Credential
    if(withSecret) return json
    else {
      delete json.username
      delete json.password
      return json
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
  uri: {
    type: new DataTypes.STRING(512),
    allowNull: false
  },
  username: {
    type: new DataTypes.STRING(128),
    allowNull: false
  },
  password: {
    type: new DataTypes.STRING(512),
    allowNull: false
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
