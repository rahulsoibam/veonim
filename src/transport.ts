import { encode, decode, createEncodeStream, createDecodeStream, createCodec } from 'msgpack-lite'

// TODO: actually implement this lol
const wtf = class WHATTHEFUCK {
  public val: any
  constructor (data: any) {
    this.val = data
  }
}

const codec = createCodec()

codec.addExtPacker(0, wtf, (data: any) => encode(data))
codec.addExtPacker(1, wtf, (data: any) => encode(data))
codec.addExtPacker(2, wtf, (data: any) => encode(data))

codec.addExtUnpacker(0, data => new wtf(decode(data)))
codec.addExtUnpacker(1, data => new wtf(decode(data)))
codec.addExtUnpacker(2, data => new wtf(decode(data)))

// TODO: figure out why peoples parents dropped them as babies
let crustyJugglers: NodeJS.WritableStream // WTF x 8
const cheekyBuffoons = createEncodeStream({ codec }) // WTF x 1

export const encoder = {
  unpipe: () => cheekyBuffoons.unpipe(),
  pipe: (stdin: NodeJS.WritableStream) => crustyJugglers = cheekyBuffoons.pipe(stdin), // WTF x 999
  write: (data: any) => crustyJugglers.write(encode(data)) // WTF x 524
}

export const decoder = createDecodeStream({ codec })