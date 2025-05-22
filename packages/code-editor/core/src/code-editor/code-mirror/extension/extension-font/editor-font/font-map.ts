import EventEmitter from 'events'
import { EditorFontFaceSet } from './font-face'

export type FontStatus = 'idle' | 'loading' | 'done'

export type FontMapValues = Omit<EditorFontFaceSet, 'fontName'> & { status: FontStatus }

interface EventMap {
  ['ready']: []
}

export class EditorFontMap extends Map<string, FontMapValues> {
  #eventEmitter = new EventEmitter<EventMap>()

  set(key: string, value: FontMapValues): this {
    super.set(key, value)

    if (this.isReady()) {
      this.#eventEmitter.emit('ready')
    }

    return this
  }

  ready = () => {
    if (this.isReady()) {
      return Promise.resolve<EditorFontMap>(this)
    }

    return new Promise<EditorFontMap>((resolve) => {
      this.#eventEmitter.once('ready', () => {
        resolve(this)
      })
    })
  }

  isReady = () => {
    const statuses = Array.from(this.values()).map((v) => v.status)

    return statuses.every((status) => status === 'done')
  }

  forEachMap = (callback: (param: FontMapValues & { fontName: string }) => void) => {
    this.forEach((value, key) => {
      callback({
        fontName: key,
        ...value,
      })
    })
  }

  setFontMapField = <Key extends keyof FontMapValues>(
    name: string,
    key: Key,
    value: FontMapValues[Key],
  ) => {
    const font = this.get(name)

    if (!font) return
    if (font[key] === value) return

    this.set(name, {
      ...font,
      [key]: value,
    })
  }

  setFontStatus = (fontName: string, status: FontStatus) => {
    this.setFontMapField(fontName, 'status', status)
  }
}

export class EditorFonts {
  #fontMap: EditorFontMap

  constructor(fontMap: EditorFontMap) {
    this.#fontMap = fontMap
  }

  hasFonts() {
    return !!this.#fontMap.size
  }

  isReady() {
    return this.#fontMap.isReady()
  }

  get ready() {
    return this.#fontMap.ready()
  }

  get fontMap() {
    return this.#fontMap
  }
}
