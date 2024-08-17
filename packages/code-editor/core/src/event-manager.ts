type EventListener<Element extends HTMLElement, Key extends keyof HTMLElementEventMap> = (
  this: Element,
  ev: HTMLElementEventMap[Key],
) => any

interface EventHandler<Element extends HTMLElement, Key extends keyof HTMLElementEventMap> {
  listener: EventListener<Element, Key>
  options?: boolean | AddEventListenerOptions
}

export class EventManager<
  Element extends HTMLElement = HTMLDivElement,
  Key extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
> {
  element: Element
  eventMap: Map<Key, EventHandler<Element, Key>>

  constructor(element: Element) {
    this.element = element
    this.eventMap = new Map()
  }

  getEventHandler<K extends Key>(type: K): EventHandler<Element, K> | null {
    return this.eventMap.get(type) ?? null
  }

  addEventHandler<K extends Key>(
    type: K,
    listener: EventListener<Element, K>,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (this.getEventHandler(type)) return

    this.element.addEventListener(type, listener as any, options)

    this.eventMap.set(type, {
      listener: listener as any,
      options,
    })
  }

  removeEventHandler(type: Key): void {
    const eventHandler = this.getEventHandler(type)

    if (!eventHandler) return

    const { listener, options } = eventHandler

    this.element.removeEventListener(type, listener as any, options)
  }

  removeAllEventHandler() {
    for (const [type, { listener, options }] of Array.from(this.eventMap)) {
      this.element.removeEventListener(type, listener as any, options)
    }
  }
}
