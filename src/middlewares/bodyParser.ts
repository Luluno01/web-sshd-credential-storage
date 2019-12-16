import { Context } from 'koa'


export async function bodyParser(ctx: Context, next: () => Promise<any>) {
  let rawBody: Buffer[] = []
  for await(const chunk of ctx.req) {
    rawBody.push(chunk)
  }
  try {
    (ctx.request as any).body = JSON.parse(Buffer.concat(rawBody).toString())
  } catch(err) {
    (ctx.request as any).body = Buffer.concat(rawBody).toString()
  }
  await next()
}

export default bodyParser