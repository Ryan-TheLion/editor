import { EditorView } from 'codemirror'

import { EventManager } from '~/src/event-manager'

import { ScrollbarDirection } from '../extension-scrollbar'

export class ScrollbarElement {
  direction: ScrollbarDirection
  protected view: EditorView

  element: HTMLDivElement

  protected eventManager: EventManager<HTMLDivElement, keyof HTMLElementEventMap>

  constructor({ direction, view }: { direction: ScrollbarDirection; view: EditorView }) {
    this.direction = direction
    this.view = view

    this.element = document.createElement('div')

    this.eventManager = new EventManager(this.element)
  }

  protected assignEvents() {
    throw new Error('상속 요소에서 assignEvents를 구현해주세요')
  }

  clear() {
    this.eventManager.removeAllEventHandler()
  }
}
