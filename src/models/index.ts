import * as User from './User'
import _sequelize from './db'
import { Model } from 'sequelize'
import Store from '../helpers/Store'
const { cache } = require('../../config.json')


export const models: { [key: string]: { default: typeof Model, sync: () => Promise<void> } } = {
  User
}

export default models

export async function sync() {
  // if(cache) await (await (new Store).init()).flushdb()
  await sequelize.sync({ force: true })
  for(const modelName in models) {
    try {
      await models[modelName].sync()
      console.log(`Model ${modelName} synchronized`)
    } catch(err) {
      console.error(`Model ${modelName} failed to synchronize: ${err.stack}`)
      throw err
    }
  }
  sequelize.close()
}

export const sequelize = _sequelize
