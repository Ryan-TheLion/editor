import { EditorView } from '@codemirror/view'

import { CodeMirrorEditor } from '../../../editor'
import { EventManager } from '../../../../../event-manager'
import { clientPosToLayerPos, offsetPos } from '../../../../../utils'
import { HORIZONTAL_TRACK_HEIGHT, SCROLL_BAR_CLASSNAME, VERTICAL_TRACK_WIDTH } from '../constants'
import { ScrollbarDirection, ScrollbarState } from '../extension-scrollbar'
import { ScrollbarElement } from './extends-element'
import { ScrollbarThumb } from './thumb'
import { CssVarFields, CssVarManager } from '../../extension-css-var'

type HorizontalTrackCssVarFields = CssVarFields<{
  hsTrackWidth: `${number}px`
  hsTrackHeight: `${number}px`
  hsTrackLeft: `${number}px`
  hsTrackTop: `${number}px` | '100%'
}>

type VerticalTrackCssVarFields = CssVarFields<{
  vsTrackWidth: `${number}px`
  vsTrackHeight: `${number}px` | '100%'
}>

type ScrollbarTrackCssVarManager<Direction extends ScrollbarDirection> =
  Direction extends 'vertical'
    ? CssVarManager<VerticalTrackCssVarFields>
    : CssVarManager<HorizontalTrackCssVarFields>

const initialCssVars = CssVarManager.cssVars({
  'hs-track-left': '0px',
  'hs-track-top': '100%',
  'hs-track-width': '0px',
  'hs-track-height': '0px',
  'vs-track-width': '0px',
  'vs-track-height': '100%',
} as CssVarFields<HorizontalTrackCssVarFields & VerticalTrackCssVarFields>)

export class ScrollbarTrack<
  Direction extends ScrollbarDirection = 'vertical',
> extends ScrollbarElement<Direction> {
  #thumb: ScrollbarThumb<Direction>

  cssVarManager: ScrollbarTrackCssVarManager<Direction>

  constructor({
    direction,
    view,
    scrollbarState,
  }: {
    direction: Direction
    view: EditorView
    scrollbarState: ScrollbarState
  }) {
    super({ direction, view, scrollbarState })

    this.element.classList.add(
      SCROLL_BAR_CLASSNAME.track,
      direction === 'vertical'
        ? SCROLL_BAR_CLASSNAME.verticalTrack
        : SCROLL_BAR_CLASSNAME.horizontalTrack,
    )

    const overflow = CodeMirrorEditor.hasOverflow(view)

    this.cssVarManager = ((): ScrollbarTrackCssVarManager<Direction> => {
      if (direction === 'vertical') {
        return new CssVarManager({
          fields: {
            'vs-track-width': `${overflow.vertical ? VERTICAL_TRACK_WIDTH : 0}px`,
            'vs-track-height': `${view.scrollDOM.clientHeight}px`,
          } as CssVarFields<VerticalTrackCssVarFields>,
          targetDOM: this.element,
        }) as ScrollbarTrackCssVarManager<Direction>
      }

      return new CssVarManager({
        fields: {
          'hs-track-width': `${Math.max(view.dom.clientWidth - view.contentDOM.offsetLeft - VERTICAL_TRACK_WIDTH, 0)}px`,
          'hs-track-height': `${overflow.horizontal ? HORIZONTAL_TRACK_HEIGHT : 0}px`,
          'hs-track-left': `${view.contentDOM.offsetLeft}px`,
          'hs-track-top': `${view.scrollDOM.clientHeight}px`,
        } as CssVarFields<HorizontalTrackCssVarFields>,
        targetDOM: this.element,
      }) as ScrollbarTrackCssVarManager<Direction>
    })()

    this.#thumb = new ScrollbarThumb<Direction>({
      track: this,
      scrollbarState: this.scrollbarState,
    })

    this.element.append(this.#thumb.element)

    this.click = this.click.bind(this)
  }

  get thumb() {
    return this.#thumb
  }

  /** @internal */
  static initialCssVars = initialCssVars

  click(event: MouseEvent | TouchEvent) {
    const target = event.target as HTMLElement

    const isTrack = target.classList.contains(SCROLL_BAR_CLASSNAME.track)

    const state = this.scrollbarState

    if (!isTrack) {
      const { layerX, layerY } = clientPosToLayerPos({ event })

      state.activeThumb = this.direction

      state.thumbStartPos = {
        ...state.thumbStartPos,
        ...(this.direction === 'vertical' ? { layerY } : { layerX }),
      }

      return
    }

    const { offsetX, offsetY } = offsetPos({ event })

    const { horizontal: hasHorizontalOverflow, vertical: hasVerticalOverflow } =
      CodeMirrorEditor.hasOverflow(this.view)

    if (this.direction === 'vertical') {
      const { clientHeight: scrollDomClientHeight, scrollHeight: scrollDomScrollHeight } =
        this.view.scrollDOM

      if (!hasVerticalOverflow) return

      const scrollTop = scrollDomScrollHeight * (offsetY / this.element.clientHeight)
      const centerOfVerticalThumb = scrollTop - scrollDomClientHeight / 2

      this.view.scrollDOM.scroll({
        top: centerOfVerticalThumb,
      })

      return
    }

    const { clientWidth: scrollDomClientWidth, scrollWidth: scrollDomScrollWidth } =
      this.view.scrollDOM

    if (!hasHorizontalOverflow) return

    const scrollLeft = scrollDomScrollWidth * (offsetX / this.element.clientWidth)
    const centerOfHorizontalThumb = scrollLeft - scrollDomClientWidth / 2

    this.view.scrollDOM.scroll({
      left: centerOfHorizontalThumb,
    })
  }

  clickEnd(e: TouchEvent) {
    const state = this.scrollbarState
    const changedTouch = e.changedTouches[0]

    if (changedTouch) {
      const { clientX, clientY } = changedTouch
      const touchTarget = document.elementFromPoint(clientX, clientY)

      if (!this.view.dom.contains(touchTarget)) {
        state.hoverInEditor = false
      }
    }

    state.activeThumb = null
    state.isThumbMoving = false
    state.thumbStartPos = {
      layerX: null,
      layerY: null,
    }
  }

  assignEvents = (eventManager: EventManager) => {
    /*
      click

      - thumb style(active)
      - set thumbStartPos
    */

    eventManager.addEventHandler('touchstart', (e) => {
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()

      if (e.touches.length > 1) return

      this.click(e)
    })

    eventManager.addEventHandler('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()

      this.click(e)
    })

    eventManager.addEventHandler('touchend', (e) => {
      this.clickEnd(e)
    })
  }

  clear(): void {
    super.clear()

    this.thumb.clear()
  }
}
