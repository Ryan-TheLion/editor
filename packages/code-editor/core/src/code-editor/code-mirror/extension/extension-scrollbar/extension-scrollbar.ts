import { Extension } from '@codemirror/state'
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view'

import { CodeMirrorEditor } from '../../editor'
import { EventManager } from '../../../../event-manager'
import { clientPosToLayerPos, createProxyObject, throttle } from '../../../../utils'
import { HORIZONTAL_TRACK_HEIGHT, SCROLL_BAR_CLASSNAME, VERTICAL_TRACK_WIDTH } from './constants'
import { ScrollbarThumb } from './elements/thumb'
import { ScrollbarTrack } from './elements/track'
import { scrollbarHidden, scrollbarTheme, scrollbarThemeColors } from './theme'
import { scrollbarElement } from './elements/extends-element'

export type ScrollbarDirection = 'vertical' | 'horizontal'

type ThumbStartPos = number | null

type ScrollbarConfig = {
  horizontalThumbMinWidth?: number
  verticalThumbMinHeight?: number
}

export interface ScrollbarState {
  hoverInEditor: boolean
  activeThumb: ScrollbarDirection | null
  isThumbMoving: boolean
  thumbStartPos: {
    layerX: ThumbStartPos
    layerY: ThumbStartPos
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

/**
 * 스크롤바 extension
 *
 * - `theme`
 *   - 스크롤바를 숨기고 싶은 경우 `hidden`으로 설정
 *   - 커스텀 테마 (스타일)을 적용하고 싶은 경우 테마 관련 extension으로 설정 (`scrollbarStyleSelector`로 관련 요소 css 선택자를 가져올 수 있음)
 */
export const scrollbar = ({ theme }: { theme?: 'hidden' | Extension } = {}) => {
  const edtiorScrollbarTheme = (({ theme }: { theme?: 'hidden' | Extension }) => {
    if (theme === 'hidden') return scrollbarHidden()

    return theme ?? scrollbarTheme({ colors: scrollbarThemeColors })
  })({ theme })

  return [
    EditorView.editorAttributes.of({ class: SCROLL_BAR_CLASSNAME.scrollbar }),
    edtiorScrollbarTheme,
    ViewPlugin.define((view) => {
      return new Scrollbar(view, { verticalThumbMinHeight: 40 })
    }),
  ]
}

export class Scrollbar implements PluginValue {
  view: EditorView

  #state!: ScrollbarState

  #config?: ScrollbarConfig

  verticalTrack!: ScrollbarTrack<'vertical'>
  horizontalTrack!: ScrollbarTrack<'horizontal'>

  #windowEventManager: EventManager<Window & typeof globalThis>
  #editorDomEventManager: EventManager<HTMLElement>
  #scrollDomEventManager: EventManager<HTMLElement>

  static debounceDelay = 300

  static throttleDelay = 30

  constructor(view: EditorView, config?: ScrollbarConfig) {
    this.view = view

    this.#config = config

    this.#state = this.#initialScrollbarState()

    this.attachTrack('vertical', view)
    this.attachTrack('horizontal', view)

    this.#windowEventManager = new EventManager(window)
    this.#editorDomEventManager = new EventManager(view.dom)
    this.#scrollDomEventManager = new EventManager(view.scrollDOM)

    this.#windowEventManager.addEventHandler('scroll', this.handleDocumentScroll)
    this.#windowEventManager.addEventHandler('mousemove', this.handleMove)
    this.#windowEventManager.addEventHandler('mouseout', (e) => {
      const fromElement = e.target as HTMLElement
      const toElement = e.relatedTarget as HTMLElement

      const mouseOut: {
        from: 'editor' | 'target'
        to: 'editor' | 'target'
      } = {
        from: this.view.dom.contains(fromElement) ? 'editor' : 'target',
        to: this.view.dom.contains(toElement) ? 'editor' : 'target',
      }

      // 에디터 요소 => 외부 요소로 움직인 마우스 이동만 처리
      // (mouseOut.from === 'editor', mouseOut.to === 'target')
      if (mouseOut.from !== 'editor' || mouseOut.to !== 'target') return

      this.state.hoverInEditor = false
    })
    this.#windowEventManager.addEventHandler('mouseup', (event) => {
      const inEditor = this.view.dom.contains(event.target as HTMLElement)

      if (!inEditor) {
        this.state.hoverInEditor = false
      }

      this.state.activeThumb = null
      this.state.isThumbMoving = false
      this.state.thumbStartPos = {
        layerX: null,
        layerY: null,
      }
    })

    this.#editorDomEventManager.addEventHandler('mouseenter', () => {
      this.state.hoverInEditor = true
    })
    this.#editorDomEventManager.addEventHandler('touchmove', this.handleMove)
    this.#editorDomEventManager.addEventHandler('mousedown', () => {
      if (this.state.hoverInEditor) return

      this.state.hoverInEditor = true
    })

    this.#scrollDomEventManager.addEventHandler('scroll', () => {
      if (!this.state.hoverInEditor) {
        this.state.hoverInEditor = true
      }

      this.scroll(view)
    })
  }

  get state() {
    return this.#state
  }

  get config() {
    return this.#config
  }

  get verticalThumb(): ScrollbarThumb<'vertical'> {
    return this.verticalTrack.thumb
  }

  get horizontalThumb(): ScrollbarThumb<'horizontal'> {
    return this.horizontalTrack.thumb
  }

  get currentViewport() {
    const scrollDOM = this.view.scrollDOM

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

  update(update: ViewUpdate) {
    if (update.focusChanged) {
      ;(() => {
        if (update.view.hasFocus && !this.state.hoverInEditor) {
          this.state.hoverInEditor = true

          return
        }

        if (!update.view.hasFocus && this.state.hoverInEditor) {
          this.state.hoverInEditor = false

          return
        }
      })()
    }

    if (!update.geometryChanged) return

    update.view.requestMeasure({
      read: (view) => {
        const { horizontal: hasHorizontalOverflow, vertical: hasVerticalOverflow } =
          CodeMirrorEditor.hasOverflow(view)

        return {
          hasHorizontalOverflow,
          hasVerticalOverflow,
          scrollDomHeight: view.scrollDOM.clientHeight,
        }
      },
      write: (measure, view) => {
        this.sync(view)
      },
      key: 'cm-scrollIntoView',
    })
  }

  destroy() {
    this.clear()
  }

  clear() {
    this.#windowEventManager.removeAllEventHandler()
    this.#editorDomEventManager.removeAllEventHandler()
    this.#scrollDomEventManager.removeAllEventHandler()

    this.verticalTrack.clear()
    this.view.scrollDOM.removeChild(this.verticalTrack.element)

    if (this.horizontalTrack) {
      this.horizontalTrack.clear()
      this.view.dom.removeChild(this.horizontalTrack.element)
    }
  }

  #initialScrollbarState() {
    const initialState: ScrollbarState = {
      activeThumb: null,
      hoverInEditor: this.view.hasFocus,
      isThumbMoving: false,
      thumbStartPos: {
        layerX: null,
        layerY: null,
      },
    }

    const editorHoverCallback = ({
      hoverInEditor,
    }: {
      hoverInEditor: ScrollbarState['hoverInEditor']
    }) => {
      if (hoverInEditor) {
        this.verticalThumb.show()
        this.horizontalThumb.show()

        return
      }

      this.verticalThumb.hide()
      this.horizontalTrack && this.horizontalThumb!.hide()
    }

    const activeThumbCallback = ({
      activeThumb,
    }: {
      activeThumb: {
        current: ScrollbarState['activeThumb']
        prev: ScrollbarState['activeThumb']
      }
    }) => {
      if (activeThumb.prev === null) {
        const currentMovingDirection = activeThumb.current

        this.verticalThumb.active(currentMovingDirection === 'vertical')
        this.horizontalThumb?.active(currentMovingDirection === 'horizontal')

        return
      }

      if (activeThumb.current === null) {
        this.verticalThumb.active(false)
        this.horizontalThumb?.active(false)
      }
    }

    return createProxyObject<ScrollbarState>({
      initial: initialState,
      onCreated(state) {
        // Scrollbar 인스턴스 생성 이후 실행되도록 지연
        // (바로 호출할 경우, editorHoverCall 내에서 this.verticalThumb 등을 정상적으로 참조할 수 없음)
        setTimeout(() => {
          editorHoverCallback({ hoverInEditor: state.hoverInEditor })
        }, 0)
      },
      onChange({ key, value, oldValue, target }) {
        if (key === 'hoverInEditor') {
          editorHoverCallback({ hoverInEditor: value as ScrollbarState['hoverInEditor'] })

          return
        }

        if (key === 'activeThumb') {
          activeThumbCallback({
            activeThumb: {
              current: value as ScrollbarState['activeThumb'],
              prev: oldValue as ScrollbarState['activeThumb'],
            },
          })

          return
        }

        if (key === 'thumbStartPos') {
          const currentThumbStatePos = value as ScrollbarState['thumbStartPos']

          if (currentThumbStatePos.layerX === null && currentThumbStatePos.layerY === null) {
            if (target.isThumbMoving) {
              target.isThumbMoving = false
            }

            return
          }
        }
      },
    })
  }

  attachTrack(dir: ScrollbarDirection, view: EditorView) {
    if (dir === 'vertical') {
      this.verticalTrack = scrollbarElement(ScrollbarTrack<'vertical'>, {
        direction: 'vertical',
        view,
        scrollbarState: this.state,
      })

      view.scrollDOM.append(this.verticalTrack.element)

      return
    }

    this.horizontalTrack = scrollbarElement(ScrollbarTrack<'horizontal'>, {
      direction: 'horizontal',
      view,
      scrollbarState: this.state,
    })

    view.dom.append(this.horizontalTrack.element)
  }

  resizeTrack(view: EditorView) {
    const { horizontal: hasHorizontalOverflow, vertical: hasVerticalOverflow } =
      CodeMirrorEditor.hasOverflow(view)

    this.verticalTrack.cssVarManager.updateCssVar({
      'vs-track-width': `${hasVerticalOverflow ? VERTICAL_TRACK_WIDTH : 0}px`,
      'vs-track-height': `${view.scrollDOM.clientHeight}px`,
    })

    this.horizontalTrack.cssVarManager.updateCssVar({
      'hs-track-width': `${Math.max(view.dom.clientWidth - view.contentDOM.offsetLeft - VERTICAL_TRACK_WIDTH, 0)}px`,
      'hs-track-height': `${hasHorizontalOverflow ? HORIZONTAL_TRACK_HEIGHT : 0}px`,
      'hs-track-left': `${view.contentDOM.offsetLeft}px`,
      'hs-track-top': `${view.scrollDOM.clientHeight}px`,
    })
  }

  resizeThumb(view: EditorView) {
    const { verticalThumbTop, verticalThumbHeight } = this.calc('vertical', view)

    this.verticalThumb.cssVarManager.updateCssVar({
      'vs-thumb-top': `${verticalThumbTop}px`,
      'vs-thumb-height': `${verticalThumbHeight}px`,
    })

    const { horizontalThumbLeft, horizontalThumbWidth } = this.calc('horizontal', view)

    this.horizontalThumb.cssVarManager.updateCssVar({
      'hs-thumb-left': `${horizontalThumbLeft}px`,
      'hs-thumb-width': `${horizontalThumbWidth}px`,
    })
  }

  sync(view: EditorView) {
    this.resizeTrack(view)
    this.resizeThumb(view)
  }

  calc<Direction extends ScrollbarDirection>(
    dir: Direction,
    view: EditorView,
  ): CalcReturn<Direction> {
    const { horizontal: hasHorizontalOverflow, vertical: hasVerticalOverflow } =
      CodeMirrorEditor.hasOverflow(view)

    if (dir === 'vertical') {
      const { scrollTop, scrollHeight } = view.scrollDOM

      const containerHeight = view.dom.clientHeight
      const contentScrollHeight = scrollHeight
      const verticalTrackHeight = this.verticalTrack.element.clientHeight

      const scrollableHeight = contentScrollHeight - containerHeight

      const verticalThumbHeight = hasVerticalOverflow
        ? (containerHeight / contentScrollHeight) * verticalTrackHeight
        : 0
      const verticalThumbTop =
        (scrollTop / scrollableHeight) *
        (verticalTrackHeight -
          Math.max(this.config?.verticalThumbMinHeight ?? 0, verticalThumbHeight))

      return {
        verticalThumbTop: Number.isNaN(verticalThumbTop) ? 0 : Math.round(verticalThumbTop),
        verticalThumbHeight: hasVerticalOverflow
          ? Math.max(this.config?.verticalThumbMinHeight ?? 0, Math.round(verticalThumbHeight))
          : 0,
      } as CalcReturn<Direction>
    }

    const { scrollLeft, scrollWidth } = view.scrollDOM

    const containerWidth = view.dom.clientWidth - view.contentDOM.offsetLeft
    const contentScrollWidth = scrollWidth - view.contentDOM.offsetLeft
    const horizontalTrackWidth = this.horizontalTrack!.element.clientWidth

    const scrollableWidth = contentScrollWidth - containerWidth

    const horizontalThumbWidth = hasHorizontalOverflow
      ? (containerWidth / contentScrollWidth) * horizontalTrackWidth
      : 0
    const horizontalThumbLeft =
      (scrollLeft / scrollableWidth) *
      (horizontalTrackWidth -
        Math.max(this.config?.horizontalThumbMinWidth ?? 0, horizontalThumbWidth))

    return {
      horizontalThumbLeft: Number.isNaN(horizontalThumbLeft) ? 0 : Math.round(horizontalThumbLeft),
      horizontalThumbWidth: hasHorizontalOverflow
        ? Math.max(this.config?.horizontalThumbMinWidth ?? 0, Math.round(horizontalThumbWidth))
        : 0,
    } as CalcReturn<Direction>
  }

  scroll(view: EditorView) {
    this.sync(view)
  }

  handleDocumentScroll = throttle((e: Event) => {
    if (this.view.hasFocus) return
    if (!this.#state.hoverInEditor) return

    this.#state.hoverInEditor = false
  }, Scrollbar.throttleDelay)

  handleMove = throttle((event: MouseEvent | TouchEvent) => {
    const { thumbStartPos } = this.#state

    if (thumbStartPos.layerX === null && thumbStartPos.layerY === null) return

    const movingDirection: ScrollbarDirection | null = (({
      thumbStartPos,
    }: {
      thumbStartPos: ScrollbarState['thumbStartPos']
    }) => {
      if (typeof thumbStartPos.layerX === 'number') {
        return 'horizontal'
      }

      if (typeof thumbStartPos.layerY === 'number') {
        return 'vertical'
      }

      return null
    })({ thumbStartPos })

    if (!movingDirection) return

    const direction: ScrollbarDirection =
      typeof thumbStartPos.layerY === 'number' ? 'vertical' : 'horizontal'

    if (direction === 'vertical' && typeof thumbStartPos.layerY === 'number') {
      this.#state.isThumbMoving = true

      this.view.scrollDOM.scrollBy({
        top:
          clientPosToLayerPos({ event, target: this.verticalThumb.element }).layerY -
          thumbStartPos.layerY,
      })

      return
    }

    if (typeof thumbStartPos.layerX === 'number') {
      this.#state.isThumbMoving = true

      this.view.scrollDOM.scrollBy({
        left:
          clientPosToLayerPos({ event, target: this.horizontalThumb.element }).layerX -
          thumbStartPos.layerX,
      })
    }
  }, Scrollbar.throttleDelay)
}
