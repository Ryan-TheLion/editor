import { EditorView } from '@codemirror/view'

import { SCROLL_BAR_CLASSNAME, SCROLL_BAR_CSS_VARS } from '../constants'
import { CalculateScrollThumb, Scrollbar, ScrollbarDirection } from '../extension-scrollbar'
import { ScrollbarElement } from './extends-element'
import { ScrollbarTrack } from './track'

type SetThumbTypeMap = {
  vertical: 'height' | 'top'
  horizontal: 'width' | 'left'
}

type SetThumbType<Direction extends ScrollbarDirection> = SetThumbTypeMap[Direction]

type CssVarMap = {
  vertical: Record<SetThumbTypeMap['vertical'], string>
  horizontal: Record<SetThumbTypeMap['horizontal'], string>
}

export class ScrollbarThumb<
  Direction extends ScrollbarDirection = 'vertical',
> extends ScrollbarElement {
  track: ScrollbarTrack<Direction>

  calc: CalculateScrollThumb

  protected setChain: SetChain<Direction>
  set: SetChain<Direction>['set']

  constructor({
    direction,
    view,
    track,
    calc,
  }: {
    direction: ScrollbarDirection
    view: EditorView
    track: ScrollbarTrack<Direction>
    calc: CalculateScrollThumb
  }) {
    super({ direction, view })

    this.element.classList.add(
      SCROLL_BAR_CLASSNAME.THUMB,
      direction === 'vertical'
        ? SCROLL_BAR_CLASSNAME.VERTICAL_THUMB
        : SCROLL_BAR_CLASSNAME.HORIZONTAL_THUMB,
    )

    this.track = track

    this.calc = calc

    this.setChain = new SetChain(this)
    this.set = this.setChain.set.bind(this.setChain)

    this.assignEvents()
  }

  protected assignEvents() {
    this.eventManager.addEventHandler('mousedown', (e) => {
      e.stopPropagation()

      Scrollbar.state.maintainingClicked = true

      if (this.direction === 'vertical') {
        const { verticalThumbTop } = this.calc('vertical', this.view)

        const gap =
          this.view.scrollDOM.clientHeight *
          ((e.layerY - verticalThumbTop) / this.element.clientHeight)

        Scrollbar.state.referenceScroll.top = gap < 0 ? 0 : gap

        return
      }

      const { horizontalThumbLeft } = this.calc('horizontal', this.view)

      const gap =
        this.view.scrollDOM.clientWidth *
        ((e.layerX - horizontalThumbLeft) / this.element.clientWidth)

      Scrollbar.state.referenceScroll.left = gap < 0 ? 0 : gap
    })
  }
}

class SetChain<Direction extends ScrollbarDirection> {
  #thumb: ScrollbarThumb<Direction>

  constructor(thumb: ScrollbarThumb<Direction>) {
    this.#thumb = thumb
  }

  set<D extends ScrollbarDirection = Direction>(type: SetThumbType<D>, value: number) {
    const cssVarMap: CssVarMap = {
      vertical: {
        height: SCROLL_BAR_CSS_VARS.VERTICAL_THUMB_HEIGHT,
        top: SCROLL_BAR_CSS_VARS.VERTICAL_THUMB_TOP,
      },
      horizontal: {
        width: SCROLL_BAR_CSS_VARS.HORIZONTAL_THUMB_WIDTH,
        left: SCROLL_BAR_CSS_VARS.HORIZONTAL_THUMB_LEFT,
      },
    }

    this.#thumb.element.style.setProperty(
      cssVarMap[this.#thumb.direction][
        type as SetThumbType<'horizontal'> & SetThumbType<'vertical'>
      ],
      `${value}px`,
    )

    return this
  }
}
