import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

import { EventManager } from '../../event-manager'
import { CONTENT_PADDING_BOTTOM, SCROLL_BAR_CLASSNAME } from './constants'
import { ScrollbarThumb } from './elements/thumb'
import { ScrollbarTrack } from './elements/track'

export type ScrollbarDirection = 'vertical' | 'horizontal'

interface ScrollbarOptions {
  horizontal?: boolean
  preventOverflowScrollChain?: boolean
}

type ReferenceScrollPosition = number | null

interface ScrollbarState {
  maintainingClicked: boolean
  referenceScroll: {
    top: ReferenceScrollPosition
    left: ReferenceScrollPosition
  }
}

export type CalculateScrollThumb = <Direction extends ScrollbarDirection>(
  dir: Direction,
  view: EditorView,
) => CalcReturn<Direction>

export type CalcReturn<Direction extends ScrollbarDirection> = Direction extends 'vertical'
  ? {
      verticalThumbTop: number
      verticalThumbHeight: number
    }
  : Direction extends 'horizontal'
    ? {
        horizontalThumbLeft: number
        horizontalThumbWidth: number
      }
    : never

export const scrollbar = ({
  horizontal = false,
  preventOverflowScrollChain = true,
}: ScrollbarOptions = {}) => {
  Scrollbar.config = {
    horizontal,
    preventOverflowScrollChain,
  }

  return ViewPlugin.fromClass(Scrollbar, {
    provide: () => [EditorView.editorAttributes.of({ class: SCROLL_BAR_CLASSNAME.SCROLL_BAR })],
  })
}

export class Scrollbar {
  view: EditorView

  static config: ScrollbarOptions
  static state: ScrollbarState = {
    maintainingClicked: false,
    referenceScroll: {
      top: null,
      left: null,
    },
  }

  verticalTrack!: ScrollbarTrack<'vertical'>
  verticalThumb!: ScrollbarThumb<'vertical'>

  horizontalTrack?: ScrollbarTrack<'horizontal'>
  horizontalThumb?: ScrollbarThumb<'horizontal'>

  resizeObserver: ResizeObserver

  #editorDomEventManager: EventManager<HTMLElement>
  #scrollDomEventManager: EventManager<HTMLElement>

  constructor(view: EditorView) {
    this.view = view

    if (Scrollbar.config.preventOverflowScrollChain) {
      document.body.style.overscrollBehavior = 'contain'
    }

    this.#editorDomEventManager = new EventManager(view.dom)
    this.#scrollDomEventManager = new EventManager(view.scrollDOM)

    this.attachTrack('vertical', view)
    this.verticalTrack.set('width', 14)

    if (Scrollbar.config.horizontal) {
      this.attachTrack('horizontal', view)
    }

    this.#scrollDomEventManager.addEventHandler('scroll', this.scroll(view))

    this.#editorDomEventManager.addEventHandler('mousemove', (e) => {
      if (!Scrollbar.state.maintainingClicked) return

      this.view.contentDOM.style.pointerEvents = 'none'

      if (Scrollbar.state.referenceScroll.top) {
        this.verticalThumb.element.classList.add(SCROLL_BAR_CLASSNAME.THUMB_ACTIVE)

        const scrollTop =
          this.view.scrollDOM.scrollHeight * (e.layerY / this.verticalTrack.element.clientHeight)

        this.view.scrollDOM.scroll({
          top: scrollTop - Scrollbar.state.referenceScroll.top,
        })

        return
      }

      if (Scrollbar.state.referenceScroll.left) {
        this.horizontalThumb!.element.classList.add(SCROLL_BAR_CLASSNAME.THUMB_ACTIVE)

        const scrollLeft =
          this.view.scrollDOM.scrollWidth * (e.layerX / this.horizontalTrack!.element.clientWidth)

        this.view.scrollDOM.scroll({
          left: scrollLeft - Scrollbar.state.referenceScroll.left,
        })

        return
      }
    })

    this.#editorDomEventManager.addEventHandler('mouseup', () => {
      Scrollbar.state.maintainingClicked = false

      if (Scrollbar.state.referenceScroll.top) {
        this.verticalThumb.element.classList.remove(SCROLL_BAR_CLASSNAME.THUMB_ACTIVE)
      }
      if (Scrollbar.state.referenceScroll.left) {
        this.horizontalThumb!.element.classList.remove(SCROLL_BAR_CLASSNAME.THUMB_ACTIVE)
      }

      Scrollbar.state.referenceScroll = {
        top: null,
        left: null,
      }

      this.view.contentDOM.style.removeProperty('pointer-events')
    })
    this.#editorDomEventManager.addEventHandler('mouseleave', () => {
      Scrollbar.state.maintainingClicked = false

      if (Scrollbar.state.referenceScroll.top) {
        this.verticalThumb.element.classList.remove(SCROLL_BAR_CLASSNAME.THUMB_ACTIVE)
      }
      if (Scrollbar.state.referenceScroll.left) {
        this.horizontalThumb!.element.classList.remove(SCROLL_BAR_CLASSNAME.THUMB_ACTIVE)
      }

      Scrollbar.state.referenceScroll = {
        top: null,
        left: null,
      }
    })

    this.resizeObserver = new ResizeObserver(() => {
      const resizeTrack = this.resizeTrack.bind(this)
      const sync = this.sync.bind(this)

      view.requestMeasure({
        read() {
          return
        },
        write(measure, view) {
          resizeTrack(view)
          sync(view)
        },
        key: 'cm-track-resize',
      })
    })

    this.resizeObserver.observe(view.dom)
  }

  update(update: ViewUpdate) {
    update.view.requestMeasure({
      read: () => {
        const prevLines = update.startState.doc.lines
        const lines = update.state.doc.lines

        const afterLineDeleted =
          prevLines !== lines &&
          update.startState.selection.main.head > update.state.selection.main.head

        return {
          prevLines,
          lines,
          afterLineDeleted,
        }
      },
      write: (measure, view) => {
        if (!update.selectionSet) return

        const { prevLines, lines, afterLineDeleted } = measure

        if (this.horizontalTrack && prevLines !== lines) {
          this.horizontalTrack.set('left', view.contentDOM.offsetLeft)
        }

        const cursor = view.scrollDOM.querySelector<HTMLElement>('.cm-cursor')

        if (cursor) {
          const left = Number(cursor.style.left.replace('px', ''))
          const top = Number(cursor.style.top.replace('px', ''))
          const height = Number(cursor.style.height.replace('px', ''))

          const clientPageX = view.scrollDOM.scrollLeft + view.scrollDOM.clientWidth
          const clientPageY = view.scrollDOM.scrollTop + view.scrollDOM.clientHeight

          const expectedOverflowX =
            prevLines === lines &&
            left >
              clientPageX - (view.contentDOM.offsetLeft + this.verticalTrack.element.offsetWidth)

          const expectedOverflowY =
            prevLines !== lines && top + height > clientPageY - CONTENT_PADDING_BOTTOM

          if (expectedOverflowX) {
            view.contentDOM.scrollIntoView({ block: 'nearest', inline: 'end' })
          }

          if (expectedOverflowY) {
            view.scrollDOM.scrollBy({
              left: 0,
              top: view.scrollDOM.scrollHeight,
            })
          }

          if (afterLineDeleted) {
            view.contentDOM.scrollIntoView({ block: 'nearest', inline: 'end' })
          }
        }
      },
      key: 'cm-scrollIntoView',
    })
  }

  destroy() {
    if (Scrollbar.config.preventOverflowScrollChain) {
      document.body.style.removeProperty('overscroll-behavior')
    }

    this.clear()
  }

  clear() {
    this.resizeObserver.disconnect()

    this.#editorDomEventManager.removeAllEventHandler()
    this.#scrollDomEventManager.removeAllEventHandler()

    this.verticalTrack.clear()
    if (this.horizontalTrack) {
      this.horizontalTrack.clear()
    }
  }

  resizeTrack(view: EditorView) {
    if (this.horizontalTrack) {
      this.horizontalTrack
        .set('width', view.contentDOM.offsetWidth - view.contentDOM.offsetLeft)
        .set('height', 14)
        .set('left', view.contentDOM.offsetLeft)
        .set('top', view.scrollDOM.clientHeight)
    }
  }

  scroll(view: EditorView) {
    return () => {
      this.sync(view)
    }
  }

  sync(view: EditorView) {
    const { verticalThumbTop, verticalThumbHeight } = this.calc('vertical', view)

    // prettier-ignore
    this.verticalThumb
      .set('top', verticalThumbTop)
      .set('height', verticalThumbHeight)

    if (this.horizontalTrack) {
      const { horizontalThumbLeft, horizontalThumbWidth } = this.calc('horizontal', view)

      // prettier-ignore
      this.horizontalThumb!
        .set('left', horizontalThumbLeft)
        .set('width', horizontalThumbWidth)
    }
  }

  calc<Direction extends ScrollbarDirection>(
    dir: Direction,
    view: EditorView,
  ): CalcReturn<Direction> {
    if (dir === 'vertical') {
      const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM

      const thumbTop = (scrollTop / scrollHeight) * clientHeight
      const thumbHeight =
        scrollHeight === clientHeight ? 0 : (clientHeight / scrollHeight) * clientHeight

      const verticalTrackSpaceGap =
        this.verticalTrack.element.offsetHeight - this.verticalTrack.element.clientHeight

      const verticalThumbHeight = thumbHeight - verticalTrackSpaceGap

      return {
        verticalThumbTop: thumbTop,
        verticalThumbHeight: verticalThumbHeight < 0 ? 0 : verticalThumbHeight,
      } as CalcReturn<Direction>
    }

    const { scrollLeft, scrollWidth, clientWidth } = view.scrollDOM

    const thumbLeft = (scrollLeft / scrollWidth) * clientWidth
    const thumbWidth = scrollWidth === clientWidth ? 0 : (clientWidth / scrollWidth) * clientWidth

    const horizontalThumbWidth =
      thumbWidth - view.contentDOM.offsetLeft - this.verticalTrack.element.offsetWidth

    return {
      horizontalThumbLeft: thumbLeft,
      horizontalThumbWidth: horizontalThumbWidth < 0 ? 0 : horizontalThumbWidth,
    } as CalcReturn<Direction>
  }

  attachTrack(dir: ScrollbarDirection, view: EditorView) {
    if (dir === 'vertical') {
      this.verticalTrack = new ScrollbarTrack<'vertical'>({
        direction: 'vertical',
        view,
        calc: this.calc.bind(this),
      })
      this.verticalThumb = this.verticalTrack.thumb

      view.scrollDOM.append(this.verticalTrack.element)

      return
    }

    this.horizontalTrack = new ScrollbarTrack<'horizontal'>({
      direction: 'horizontal',
      view,
      calc: this.calc.bind(this),
    })
    this.horizontalThumb = this.horizontalTrack.thumb

    view.dom.append(this.horizontalTrack.element)
  }
}
