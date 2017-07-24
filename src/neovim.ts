import { req, api, onRedraw, onExit, subscribe, attachToVim, switchToVim, newVim, resize } from './master-control'
import { Watchers, onFnCall } from './utils'
import { Functions } from './functions'

type GenericCallback = (...args: any[]) => void

export interface NeovimEvents {
  redraw(fn: (instructions: any[]) => void): void,
  exit(fn: (id: number, code: number) => void): void
}

export interface Neovim {
  resize(width: number, height: number): void,
  input(keys: string): void,
  cmd(command: string): void,
  ex(command: string): Promise<string>,
  expr(expression: string): Promise<any>,
  action(event: string, cb: GenericCallback): void,
  getColor(id: number): Promise<{ fg: number, bg: number }>,
  subscribe(event: string, cb: GenericCallback): void,
  call: Functions,
  switchTo(id: number): void,
  create(): Promise<number>,
  attach(id: number): void,
  getVar(key: string): Promise<any>,
  setVar(key: string, val: any): void,
  on: NeovimEvents
}

const watchers = new Watchers()
const a: Neovim = {} as Neovim

a.resize = (w, h) => resize(w, h)
a.input = m => api.input(m)
a.cmd = m => api.command(m)
a.ex = m => req.commandOutput(m)
a.expr = m => req.eval(m)
a.action = (e, cb) => watchers.add(e, cb)
a.subscribe = (e, cb) => subscribe(e, cb)
a.call = onFnCall((name: string, args: any[] = []) => req.callFunction(name, args))
a.switchTo = id => switchToVim(id),
a.create = () => Promise.resolve(newVim()),
a.attach = id => attachToVim(id),
a.setVar = (key, val) => api.setVar(key, val),

a.getVar = async key => {
  const val = await req.getVar(key as string).catch(e => e)
  if (!Array.isArray(val) && val[1] !== 'Key not found') return val
}

a.getColor = async id => {
  const [ fg = 0, bg = 0 ] = await Promise.all([
    a.call.synIDattr(id, 'fg#'),
    a.call.synIDattr(id, 'bg#')
  ]).catch(e => e)

  return { fg, bg }
}

a.on = {
  redraw: fn => onRedraw(fn),
  exit: fn => onExit(fn)
}

subscribe('veonim', ([ event, ...args ]) => watchers.notify(event, args))

export default a
