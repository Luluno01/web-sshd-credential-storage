import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as cors from './cors'
import * as bodyParser from './bodyParser'
import * as responseTime from './responseTime'
import { MiddlewareModule } from '../global'


export const middlewareModules: MiddlewareModule[] = [
  bodyParser,
  responseTime
]

export default function installMiddlewares(app: Koa, router: Router) {
  cors.init(app, router)
  app.use(cors.default)
  for(const mod of middlewareModules) {
    if('init' in mod) mod.init(app, router)
    if('default' in mod) router.use(mod.default)
  }
}
