import RouterController from './RouterController'
import * as Router from 'koa-router'
import Cred from '../models/Credential'
import { FindOptions } from 'sequelize/types'


const router = new Router

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
  const options: FindOptions = {}
  if(group !== undefined) options.where = { group }
  ctx.body = (await Cred.findAll(options)).map(credential => credential.toJSON(ctx.query['with-secret']))
})

/**
 * Get credential
 */
router.get('/:id(\\d+)', async ctx => {
  const credential = await Cred.findByPk(ctx.params.id)
  ctx.assert(credential, 404, 'Credential not found')
  ctx.body = credential.toJSON(ctx.query['with-secret'])
})

/**
 * Create new credential
 */
router.post('/', async ctx => {
  const { request: { body } } = ctx as any
  ctx.assert('name' in body && 'uri' in body && 'username' in body && 'password' in body, 400, 'Invalid request body')
  const { name, uri, username, password } = body
  ctx.assert(name && uri && username && password, 400, 'Name, URI, user name and password are required and cannot be empty')
  let { group } = body
  if(typeof group == 'string') group = group || null
  else group = null
  ctx.body = (await Cred.create({
    name,
    uri,
    username,
    password,
    group
  })).id
})

/**
 * Delete credential(s)
 */
router.delete('/', async ctx => {
  const { request: { body } } = ctx as any
  ctx.assert(body instanceof Array && body.every(elem => typeof elem == 'number'), 400, 'Invalid request body')
  const credentials = (await Promise.all((body as number[]).map(id => Cred.findByPk(id)))).filter(credential => credential != null)
  await Promise.all(credentials.map(credential => credential.destroy()))
  ctx.body = credentials.map(credential => credential.toJSON(ctx.query['with-secret']))
})

/**
 * Delete credential
 */
router.delete('/:id(\\d+)', async ctx => {
  const credential = await Cred.findByPk(ctx.params.id)
  ctx.assert(credential, 404, 'Credential not found')
  await credential.destroy()
  ctx.body = credential.toJSON(ctx.query['with-secret'])
})

/**
 * Update credential
 */
router.put('/:id(\\d+)', async ctx => {
  const { request: { body } } = ctx as any
  ctx.assert('name' in body || 'uri' in body || 'username' in body || 'password' in body || 'group' in body, 400, 'Invalid request body')
  const { name, uri, username, password } = body
  let { group } = body
  ctx.assert(name || uri || username || password || typeof group == 'string' || group === null, 400, 'At least one of name, URI, user name, password and group should be provided and none empty')
  if(typeof group == 'string') group = group || null
  else group = null
  const credential = await Cred.findByPk(ctx.params.id)
  ctx.assert(credential, 404, 'Credential not found')
  if(name) {
    credential.name = name
  }
  if(uri) {
    credential.uri = uri
  }
  if(username) {
    credential.username = username
  }
  if(password) {
    credential.password = password
  }
  if(typeof group == 'string' || group === null) {
    credential.group = group
  }
  await credential.save()
  ctx.body = credential.toJSON(ctx.query['with-secret'])
})

export default class Credential extends RouterController {
  pattern = '/credentials'
  router = router
}
