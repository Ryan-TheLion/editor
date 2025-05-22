import { EditorView } from '@codemirror/view'

import { EventManager } from '../../../../../event-manager'
import { isAsyncFunction } from '../../../../../utils'
import { ScrollbarDirection, ScrollbarState } from '../extension-scrollbar'

type ScrollbarElementConstructorParams<Direction extends ScrollbarDirection> = {
  direction: Direction
  view: EditorView
  scrollbarState: ScrollbarState
}

type ScrollbarElementConstructor<Direction extends ScrollbarDirection> = new (
  params: ScrollbarElementConstructorParams<Direction>,
) => ScrollbarElement<Direction>

export const scrollbarElement = <
  T extends ScrollbarElementConstructor<Direction>,
  Direction extends ScrollbarDirection,
>(
  element: T,
  params: {
    direction: Direction
    view: EditorView
    scrollbarState: ScrollbarState
  },
) => {
  return new ScrollbarElementView<Direction>(element, params).scrollbarElement as InstanceType<T>
}

class ScrollbarElementView<Direction extends ScrollbarDirection> {
  scrollbarElement: ScrollbarElement<Direction>

  constructor(
    scrollbarElement: ScrollbarElementConstructor<Direction>,
    params: ScrollbarElementConstructorParams<Direction>,
  ) {
    this.scrollbarElement = new scrollbarElement(params)

    const assignEvents = this.scrollbarElement.assignEvents

    if (!assignEvents) return

    const eventManager = this.scrollbarElement.eventManager

    if (isAsyncFunction(assignEvents)) {
      ;(async () => {
        await assignEvents(eventManager)
      })()

      return
    }

    assignEvents(eventManager)
  }
}

export class ScrollbarElement<Direction extends ScrollbarDirection> {
  #direction: Direction
  #view: EditorView

  #element: HTMLDivElement

  #eventManager: EventManager<HTMLDivElement>

  protected scrollbarState: ScrollbarState

  constructor({ direction, view, scrollbarState }: ScrollbarElementConstructorParams<Direction>) {
    this.#direction = direction
    this.#view = view

    this.scrollbarState = scrollbarState

    this.#element = document.createElement('div')

    this.#eventManager = new EventManager(this.#element)
  }

  get view() {
    return this.#view
  }

  get direction() {
    return this.#direction
  }

  get element() {
    return this.#element
  }

  get eventManager() {
    return this.#eventManager
  }

  assignEvents:
    | ((eventManager: EventManager<HTMLDivElement>) => void)
    | ((eventManager: EventManager<HTMLDivElement>) => Promise<void>)
    | null = null

  clear() {
    this.#eventManager.removeAllEventHandler()
  }
}
