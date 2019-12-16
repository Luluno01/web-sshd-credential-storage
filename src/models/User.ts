import { Model, DataTypes } from 'sequelize'
import sequelize from './db'
import { formatError } from '../helpers/formatError'
import Store from '../helpers/Store'
const { cache } = require('../../config.json')


export default class User extends Model {
  public id!: number  // Note that the `null assertion` `!` is required in strict mode.
  public name!: string
  public preferredName!: string | null  // for nullable fields

  // timestamps!
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  public static associations: {}
}

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  preferredName: {
    type: new DataTypes.STRING(128),
    allowNull: true
  }
}, {
  sequelize
})

const store = new Store

export async function sync() {
  // await User.sync({ force: true })  // This is done in ./index.ts
}
