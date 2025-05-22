import { isEqual } from './utils'

type EventDOM = HTMLElement | (Window & typeof globalThis)

type EventMapKey = keyof HTMLElementEventMap

type EventListener<DOM extends EventDOM, Key extends EventMapKey> = (
  this: DOM,
  event: HTMLElementEventMap[Key],
) => any

interface EventHandler<DOM extends EventDOM, Key extends EventMapKey> {
  listener: EventListener<DOM, Key>
  options?: EventHandlerOptions
}

type EventHandlerOptions = boolean | AddEventListenerOptions

type EventHandlers<DOM extends EventDOM, Key extends EventMapKey> = EventHandler<DOM, Key>[]

export class EventManager<
  DOM extends EventDOM = HTMLDivElement,
  Key extends EventMapKey = EventMapKey,
> {
  element: DOM
  eventMap: Map<Key, EventHandlers<DOM, Key>>

  constructor(element: DOM) {
    this.element = element
    this.eventMap = new Map()
  }

  getEventHandlers<K extends Key>(type: K): EventHandlers<DOM, K> | null {
    const handlers = this.eventMap.get(type)

    if (!handlers || !handlers.length) return null

    return handlers
  }

  hasHandler<K extends Key>(
    type: K,
    listener: EventListener<DOM, K>,
    options?: EventHandlerOptions,
  ) {
    const handlers = this.getEventHandlers(type)

    if (!handlers) return false

    return handlers.some((handler) =>
      this.#isSameHandler(handler as EventHandler<DOM, Key>, {
        listener: listener as EventListener<DOM, Key>,
        options,
      }),
    )
  }

  addEventHandler<K extends Key>(
    type: K,
    listener: EventListener<DOM, K>,
    options?: EventHandlerOptions,
  ): void {
    const handlers = this.getEventHandlers(type as Key)

    if (this.hasHandler(type, listener, options)) return

    this.element.addEventListener(type, listener as any, options)

    if (!handlers) {
      this.eventMap.set(type, [{ listener: listener as EventListener<DOM, Key>, options }])

      return
    }

    handlers.push({
      listener: listener as EventListener<DOM, Key>,
      options,
    })
  }

  removeEventHandler(type: Key, listener: any, options?: EventHandlerOptions): void {
    const handlers = this.getEventHandlers(type)

    if (!handlers) return

    this.element.removeEventListener(type, listener as any, options)

    const deleteIndex = ((handlers: EventHandlers<DOM, Key>) => {
      const index = handlers.findIndex((handler) =>
        this.#isSameHandler(handler, { listener, options }),
      )

      if (index < 0) return null

      return index
    })(handlers)

    // check nullish
    if (deleteIndex == null) return

    handlers.splice(deleteIndex, 1)

    if (!handlers.length) {
      this.eventMap.delete(type)
    }
  }

  removeAllEventHandler() {
    for (const [type, handlers] of Array.from(this.eventMap)) {
      handlers.forEach((handler) => {
        this.element.removeEventListener(type, handler.listener as any, handler.options)
      })

      this.eventMap.delete(type)
    }
  }

  #isSameHandler(handlerA: EventHandler<DOM, Key>, handlerB: EventHandler<DOM, Key>) {
    if (handlerA.listener !== handlerB.listener) return false

    return isEqual(handlerA.options, handlerB.options)
  }
}
