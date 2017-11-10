import { cmd, on } from '../neovim'
import { sub } from '../../dispatch'
const watch = require('node-watch')
import { join } from 'path'

const sessions = new Map<number, Set<string>>()
const watchers = new Map<string, any>()
let currentSession: Set<string>

const anySessionsHaveFile = (file: string) => [...sessions.values()].some(s => s.has(file))

sub('session:switch', (id: number) => {
  if (sessions.has(id)) currentSession = sessions.get(id)!
  else sessions.set(id, currentSession = new Set<string>())
  cmd(`checktime`)
})

on.bufLoad(({ cwd, file }) => {
  const filepath = join(cwd, file)
  if (!filepath) return
  currentSession.add(filepath)
  const w = watch(filepath, () => currentSession.has(filepath) && cmd(`checktime ${filepath}`))
  watchers.set(filepath, w)
})

on.bufUnload(({ cwd, file }) => {
  const filepath = join(cwd, file)
  if (!filepath) return
  currentSession.delete(filepath)
  if (anySessionsHaveFile(filepath)) return
  watchers.has(filepath) && watchers.get(filepath)!.close()
})

