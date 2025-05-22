import { uniqWith } from 'lodash-es'

import { EditorUpdateCallback } from '../typing'

export class EditorUpdateObserver {
  #callbacks: EditorUpdateCallback[]

  constructor() {
    this.#callbacks = []
  }

  forEach(...payload: Parameters<EditorUpdateCallback>) {
    if (this.#empty()) return

    this.#callbacks.forEach((callback) => callback(...payload))
  }

  observe(callback: EditorUpdateCallback) {
    this.#callbacks.push(callback)

    this.#callbacks = uniqWith(this.#callbacks, (a, b) => {
      return a === b
    })
  }

  remove(callback: EditorUpdateCallback) {
    if (!this.#has(callback)) {
      return
    }

    this.#callbacks = this.#callbacks.filter((_callback) => _callback !== callback)
  }

  disconnect() {
    if (this.#empty()) return

    this.#callbacks = []
  }

  #has(callback: EditorUpdateCallback) {
    return !!this.#callbacks.find((_callback) => _callback === callback)
  }

  #empty() {
    return !this.#callbacks.length
  }
}
