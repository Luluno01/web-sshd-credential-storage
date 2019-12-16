import * as _readline from 'readline'


export function readline(prompt: string) {
  const rl = _readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise<string>(res => {
    rl.question(prompt, answer => {
      rl.close()
      res(answer)
    })
  })
}

const yes = new Set([ 'y', 'yes'])

export function isYes(answer: string) {
  return yes.has(answer.toLowerCase())
}
