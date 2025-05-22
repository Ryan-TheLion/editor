export type ClipboardCopySuccessCallback = (text: string) => void | Promise<void>

export type ClipboardCopyErrorCallback = (error: any) => void | Promise<void>

export type ClipboardCopyingCallback = () => void | Promise<void>

export interface ClipBoardCopy {
  success?: ClipboardCopySuccessCallback
  error?: ClipboardCopyErrorCallback
  copying?: ClipboardCopyingCallback
}

export class ClipboardManager {
  #status: { copying: boolean }

  constructor() {
    this.#status = {
      copying: false,
    }

    this.copy.bind(this)
  }

  resolve = async (callback: void | Promise<void>) => {
    const isPromise = callback instanceof Promise

    if (!isPromise) return

    await callback
  }

  async copy(text: string, { success, error, copying }: ClipBoardCopy = {}) {
    if (this.#status.copying) {
      if (copying) {
        this.resolve(copying())
      }

      return
    }

    this.#status.copying = true

    try {
      await navigator.clipboard.writeText(text)

      if (success) {
        await this.resolve(success(text))
      }

      this.#status.copying = false
    } catch (e) {
      if (error) {
        await this.resolve(error(e))
      }

      this.#status.copying = false
    }
  }
}
