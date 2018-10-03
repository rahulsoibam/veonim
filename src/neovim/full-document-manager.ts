import filetypeToLanguageID from '../langserv/vsc-languages'
import { Range } from 'vscode-languageserver-protocol'
import { NeovimAPI } from '../neovim/api'
import { Buffer } from '../neovim/types'
import { EventEmitter } from 'events'

interface Doc {
  name: string
  uri: string
}

interface DocInfo extends Doc {
  languageId: string
  filetype: string
  version: number
}

interface DidOpen extends DocInfo {
  textLines: string[]
}

interface TextChange {
  range: Range,
  textLines: string[],
}

interface DidChange extends DocInfo {
  textChanges: TextChange
}

interface NotifyParams {
  buffer: Buffer
  name: string
  filetype: string
  revision: number
}

type On<T> = (params: T) => void

const api = (nvim: NeovimAPI, onlyFiletypeBuffers?: string[]) => {
  const openDocuments = new Set<string>()
  const watchers = new EventEmitter()
  const filetypes = new Set(onlyFiletypeBuffers)
  const invalidFiletype = (ft: string) => filetypes.size && !filetypes.has(ft)

  const notifyOpen = async ({ name, filetype, revision, buffer }: NotifyParams) => {
    openDocuments.add(name)
    const textLines = await buffer.getAllLines()

    watchers.emit('didOpen', {
      name,
      filetype,
      textLines,
      version: revision,
      uri: `file://${name}`,
      languageId: filetypeToLanguageID(filetype),
    } as DidOpen)
  }

  const notifyChange = async ({ name, filetype, revision, buffer }: NotifyParams) => {
    const textLines = await buffer.getAllLines()

    const textChanges: TextChange = {
      textLines,
      range: {
        start: { line: 0, character: 0 },
        end: { line: textLines.length, character: 0 }
      }
    }

    watchers.emit('didChange', {
      name,
      filetype,
      textChanges,
      version: revision,
      uri: `file://${name}`,
      languageId: filetypeToLanguageID(filetype),
    } as DidChange)
  }

  const openBuffer = async (buffer: Buffer) => {
    const filetype = await buffer.getOption('filetype')
    if (invalidFiletype(filetype)) return

    const [ name, revision ] = await Promise.all([
      buffer.name,
      buffer.changedtick,
    ])

    if (!name) return

    notifyOpen({ buffer, name, filetype, revision })
  }

  const changeBuffer = () => {
    if (invalidFiletype(nvim.state.filetype)) return
    const name = nvim.state.absoluteFilepath
    if (!name) return

    const params: NotifyParams = ({
      name,
      buffer: nvim.current.buffer,
      revision: nvim.state.revision,
      filetype: nvim.state.filetype,
    })

    openDocuments.has(name)
      ? notifyChange(params)
      : notifyOpen(params)
  }

  nvim.on.bufOpen(openBuffer)
  nvim.on.bufLoad(changeBuffer)
  nvim.on.bufChange(changeBuffer)

  nvim.on.bufWritePre(() => {
    if (invalidFiletype(nvim.state.filetype)) return
    watchers.emit('willSave', {
      name: nvim.state.absoluteFilepath,
      uri: `file://${nvim.state.absoluteFilepath}`,
    } as Doc)
  })

  nvim.on.bufWrite(() => {
    if (invalidFiletype(nvim.state.filetype)) return
    watchers.emit('didSave', {
      name: nvim.state.absoluteFilepath,
      uri: `file://${nvim.state.absoluteFilepath}`,
    } as Doc)
  })

  nvim.on.bufClose(async buffer => {
    const name = await buffer.name
    if (!name) return
    openDocuments.delete(name)
    watchers.emit('didClose', {
      name,
      uri: `file://${name}`,
    } as Doc)
  })

  const on = {
    didOpen: (fn: On<DidOpen>) => watchers.on('didOpen', fn),
    didChange: (fn: On<DidChange>) => watchers.on('didChange', fn),
    willSave: (fn: On<Doc>) => watchers.on('willSave', fn),
    didSave: (fn: On<Doc>) => watchers.on('didSave', fn),
    didClose: (fn: On<Doc>) => watchers.on('didClose', fn),
  }

  // TODO: please dispose
  // detach from buffers and cleanup
  const dispose = () => {
    console.warn('NYI: dipose FullDocumentManager')
  }

  return { on, dispose, manualBindBuffer: openBuffer }
}

export default api
export type FullDocumentManager = ReturnType<typeof api>
