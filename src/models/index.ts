import * as Credential from './Credential'
import _sequelize from './db'
import { Model } from 'sequelize'


export const models: { [key: string]: { default: typeof Model, sync: () => Promise<void> } } = {
  Credential
}

export default models

export async function sync() {
  await sequelize.sync({ force: true })
  for(const modelName in models) {
    try {
      await models[modelName].sync()
      console.log(`Model ${modelName} synchronized`)
    } catch(err) {
      console.error(`Model ${modelName} failed to synchronize: ${err.stack}`)
      sequelize.close()
      throw err
    }
  }
}

export const sequelize = _sequelize
