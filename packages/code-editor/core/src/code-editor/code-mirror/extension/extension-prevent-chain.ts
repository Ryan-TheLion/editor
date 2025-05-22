import { EditorView, PluginValue, ViewPlugin } from '@codemirror/view'
import { EventManager } from '../../../event-manager'

type HorizontalScrollDirection = 'toLeft' | 'toRight' | 'stationary'

type VerticalScrollDirection = 'toUp' | 'toDown' | 'stationary'

export const preventScrollChain = () => {
  return ViewPlugin.fromClass(PreventScrollChain)
}

class PreventScrollChain implements PluginValue {
  view: EditorView

  eventManager: EventManager<HTMLElement>

  #lastTouch: {
    x: number
    y: number
  } | null

  constructor(view: EditorView) {
    this.view = view

    this.#lastTouch = null

    this.eventManager = new EventManager(this.scrollDOM)

    this.eventManager.addEventHandler('wheel', this.preventWheelScrollChain, {
      passive: false,
    })

    this.eventManager.addEventHandler('touchmove', this.preventTouchScrollChain, {
      passive: false,
    })

    this.eventManager.addEventHandler('touchend', () => {
      this.#lastTouch = null
    })
  }

  get scrollDOM() {
    return this.view.scrollDOM
  }

  get currentViewport() {
    const scrollDOM = this.scrollDOM

    const viewport = {
      horizontal: {
        start: scrollDOM.scrollLeft,
        end: scrollDOM.scrollLeft + scrollDOM.clientWidth,
      },
      vertical: {
        start: scrollDOM.scrollTop,
        end: scrollDOM.scrollTop + scrollDOM.clientHeight,
      },
    }

    const atHorizontalStart = viewport.horizontal.start === 0
    const atHorizontalEnd = Math.ceil(viewport.horizontal.end) >= scrollDOM.scrollWidth

    const atVerticalStart = viewport.vertical.start === 0
    const atVerticalEnd = Math.ceil(viewport.vertical.end) >= scrollDOM.scrollHeight

    return {
      ...viewport,
      atHorizontalStart,
      atHorizontalEnd,
      atVerticalStart,
      atVerticalEnd,
    }
  }

  scrollDirectionFromDelta({ deltaX, deltaY }: { deltaX: number; deltaY: number }): {
    horizontalScrollDirection: HorizontalScrollDirection
    verticalScrollDirection: VerticalScrollDirection
  } {
    const horizontalScrollDirection: HorizontalScrollDirection = (({
      deltaX,
      deltaY,
    }: {
      deltaX: number
      deltaY: number
    }) => {
      if (deltaX === 0) return 'stationary'

      if (Math.abs(deltaX) < 4 && Math.abs(deltaY) > 4) return 'stationary'

      return deltaX < 0 ? 'toLeft' : 'toRight'
    })({ deltaX, deltaY })

    const verticalScrollDirection: VerticalScrollDirection = (({
      deltaX,
      deltaY,
    }: {
      deltaX: number
      deltaY: number
    }) => {
      if (deltaY === 0) return 'stationary'

      if (Math.abs(deltaY) < 4 && Math.abs(deltaX) > 4) return 'stationary'

      return deltaY < 0 ? 'toUp' : 'toDown'
    })({ deltaX, deltaY })

    return {
      horizontalScrollDirection,
      verticalScrollDirection,
    }
  }

  shouldPreventScrollChain({ deltaX, deltaY }: { deltaX: number; deltaY: number }): boolean {
    const { atHorizontalStart, atHorizontalEnd, atVerticalStart, atVerticalEnd } =
      this.currentViewport

    const { horizontalScrollDirection, verticalScrollDirection } = this.scrollDirectionFromDelta({
      deltaX,
      deltaY,
    })

    if (!atHorizontalStart && !atHorizontalEnd && !atVerticalStart && !atVerticalEnd) return false

    if (
      horizontalScrollDirection === 'toLeft' &&
      verticalScrollDirection === 'stationary' &&
      atHorizontalStart
    ) {
      return true
    }
    if (
      horizontalScrollDirection === 'toRight' &&
      verticalScrollDirection === 'stationary' &&
      atHorizontalEnd
    ) {
      return true
    }
    if (
      verticalScrollDirection === 'toUp' &&
      horizontalScrollDirection === 'stationary' &&
      atVerticalStart
    ) {
      return true
    }
    if (
      verticalScrollDirection === 'toDown' &&
      horizontalScrollDirection === 'stationary' &&
      atVerticalEnd
    ) {
      return true
    }

    return false
  }

  /**
   * scroll chain 방지
   *
   * - 휠(wheel) 이벤트를 감지하여, scroll chain 을 방지(트랙패드 제스처에 의한 스크롤 체인 방지 목적)
   * -
   *   - scrollLeft가 0 이고, deltaX가 0보다 작은 경우(`←` 방향으로 스크롤)
   *   - scrollLeft + scrollDOM.clientWidth >= scrollDOM.scrollWidth 이고, deltaX가 0보다 큰 경우(`→` 방향으로 스크롤)
   *   - scrollTop이 0 이고, deltaY가 0보다 작은 경우(`↑` 방향으로 스크롤)
   *   - scrollTop + scrollDOM.clientHeight >= scrollDOM>scrollDOM.scrollHeight 이고, deltaY가 0보다 큰 경우(`↓` 방향으로 스크롤)
   */
  preventWheelScrollChain = (e: WheelEvent) => {
    const target = e.target as HTMLElement

    const inEditorDOM = this.view.dom.contains(target)

    if (!inEditorDOM) return

    const preventChain = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!this.shouldPreventScrollChain({ deltaX: e.deltaX, deltaY: e.deltaY })) return
    if (e.shiftKey) return

    preventChain(e)
  }

  /**
   * scroll chain 방지
   *
   * - touch move 이벤트를 감지하여, scroll chain 을 방지(모바일 디바이스에서 터치 제스처에 의한 스크롤 체인 방지 목적)
   * -
   *   - scrollLeft가 0 이고, deltaX가 0보다 작은 경우(`←` 방향으로 스크롤)
   *   - scrollLeft + scrollDOM.clientWidth >= scrollDOM.scrollWidth 이고, deltaX가 0보다 큰 경우(`→` 방향으로 스크롤)
   *   - scrollTop이 0 이고, deltaY가 0보다 작은 경우(`↑` 방향으로 스크롤)
   *   - scrollTop + scrollDOM.clientHeight >= scrollDOM>scrollDOM.scrollHeight 이고, deltaY가 0보다 큰 경우(`↓` 방향으로 스크롤)
   */
  preventTouchScrollChain = (e: TouchEvent) => {
    const preventTouchEvent = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    const target = e.target as HTMLElement

    const inEditorDOM = this.view.dom.contains(target)

    if (!inEditorDOM) return

    const lastTouch = this.#lastTouch
    const touch = e.targetTouches[0]!

    if (lastTouch === null) {
      this.#lastTouch = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const deltaX = (lastTouch?.x ?? touch.clientX) - touch.clientX
    const deltaY = (lastTouch?.y ?? touch.clientY) - touch.clientY

    if (this.shouldPreventScrollChain({ deltaX, deltaY })) {
      preventTouchEvent(e)
    }

    this.#lastTouch = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }
}
