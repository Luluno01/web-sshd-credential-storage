import RouterController from './RouterController'
import * as Router from 'koa-router'
import Cred, { CredentialData } from '../models/Credential'
import { Op } from 'sequelize'
import { FindOptions } from 'sequelize/types'
import { Context } from 'koa'


const router = new Router

function getKeyOrThrow(ctx: Context) {
  const password = ctx.get('X-KEY')
  ctx.assert(password, 400, 'Missing X-KEY header')
  return Buffer.from(password, 'base64')
}

/**
 * Get all credentials or credentials in a given group
 */
router.get('/', async ctx => {
  let group: string | undefined
  try {
    if(ctx.query.group) group = JSON.parse(ctx.query.group)
  } catch(err) {
    ctx.throw(400, 'Group name must be either `null` or wrapped by quotes')
  }
  const password = getKeyOrThrow(ctx)
  ctx.assert(await Cred.sentinelVerify(password), 403, 'Invalid password')
  const options: FindOptions = { where: { id: { [Op.ne]: 1 } } }
  if(group !== undefined) options.where['group'] = group
  ctx.body = (await Promise.all((await Cred.findAll(options)).map(async credential => {
    if (credential.id == 1) return null
    try {
      return await credential.toDecryptedJSON(password, ctx.query['with-secret'])
    } catch (err) {
      return null
    }
  }))).filter(json => !!json)
})

/**
 * Get credential
 */
router.get('/:id(\\d+)', async ctx => {
  const password = getKeyOrThrow(ctx)
  ctx.assert(await Cred.sentinelVerify(password), 403, 'Invalid password')
  ctx.assert(parseInt(ctx.params.id) != 1, 404, 'Credential not found')
  const credential = await Cred.findByPk(ctx.params.id)
  ctx.assert(credential, 404, 'Credential not found')
  try {
    ctx.body = await credential.toDecryptedJSON(password, ctx.query['with-secret'])
  } catch (err) {
    ctx.throw(403, 'Invalid password')
  }
})

/**
 * Create new credential
 */
router.post('/', async ctx => {
  const cipherKey = getKeyOrThrow(ctx)
  ctx.assert(await Cred.sentinelVerify(cipherKey), 403, 'Invalid password')
  const { request: { body } } = ctx as any
  ctx.assert('name' in body && 'uri' in body && 'username' in body && 'password' in body, 400, 'Invalid request body')
  const { name, uri, username, password } = body
  ctx.assert(name && uri && username && password, 400, 'Name, URI, user name and password are required and cannot be empty')
  let { group } = body
  if(typeof group == 'string') group = group || null
  else group = null
  ctx.body = (await Cred.createEncrypted({
    name,
    uri,
    username,
    password,
    group
  }, cipherKey, { returning: true })).id
})

/**
 * Delete credential(s)
 */
router.delete('/', async ctx => {
  const password = getKeyOrThrow(ctx)
  ctx.assert(await Cred.sentinelVerify(password), 403, 'Invalid password')
  const { request: { body } } = ctx as any
  ctx.assert(body instanceof Array && body.every(elem => typeof elem == 'number'), 400, 'Invalid request body')
  const res = await Promise.all((body as number[]).map(async id => {
    if (id == 1) return null
    const credential = await Cred.findByPk(id)
    if (credential) {
      try {
        return { credential, data: await credential.toDecryptedJSON(password, ctx.query['with-secret']) }
      } catch (err) {
        return null
      }
    } else return null
  }))
  await Promise.all(res.map(async credentialAndData => {
    if (credentialAndData) await credentialAndData.credential.destroy()
  }))
  ctx.body = res.filter(credentialAndData => !!credentialAndData).map(({ data }) => data)
})

/**
 * Delete credential
 */
router.delete('/:id(\\d+)', async ctx => {
  const password = getKeyOrThrow(ctx)
  ctx.assert(await Cred.sentinelVerify(password), 403, 'Invalid password')
  ctx.assert(parseInt(ctx.params.id) != 1, 404, 'Credential not found')
  const credential = await Cred.findByPk(ctx.params.id)
  ctx.assert(credential, 404, 'Credential not found')
  try {
    ctx.body = await credential.toDecryptedJSON(password, ctx.query['with-secret'])
  } catch (err) {
    ctx.throw(403, 'Invalid password')
  }
  await credential.destroy()
})

/**
 * Update credential
 */
router.put('/:id(\\d+)', async ctx => {
  const cipherKey = getKeyOrThrow(ctx)
  ctx.assert(await Cred.sentinelVerify(cipherKey), 403, 'Invalid password')
  const { request: { body } } = ctx as any
  ctx.assert('name' in body || 'uri' in body || 'username' in body || 'password' in body || 'group' in body, 400, 'Invalid request body')
  const { name, uri, username, password } = body
  let { group } = body
  ctx.assert(name || uri || username || password || typeof group == 'string' || group === null, 400, 'At least one of name, URI, user name, password and group should be provided and none empty')
  if(typeof group == 'string') group = group || null
  else group = null
  ctx.assert(parseInt(ctx.params.id) != 1, 404, 'Credential not found')
  const credential = await Cred.findByPk(ctx.params.id)
  ctx.assert(credential, 404, 'Credential not found')
  let data: CredentialData & { id?: number }
  try {
    data = await credential.toDecryptedJSON(cipherKey, true)
  } catch (err) {
    ctx.throw(403, 'Password does not match')
  }
  delete data.id
  if(name) {
    data.name = name
  }
  if(uri) {
    data.uri = uri
  }
  if(username) {
    data.username = username
  }
  if(password) {
    data.password = password
  }
  if(typeof group == 'string' || group === null) {
    data.group = group
  }
  await credential.setDataEncrypted(data, cipherKey)
  await credential.save()
  ctx.body = await credential.toDecryptedJSON(cipherKey, ctx.query['with-secret'])
})

export default class Credential extends RouterController {
  pattern = '/credentials'
  router = router
}
