import { EditorView } from '@codemirror/view'

import { SCROLL_BAR_CLASSNAME, SCROLL_BAR_CSS_VARS } from '../constants'
import { CalculateScrollThumb, ScrollbarDirection } from '../extension-scrollbar'
import { ScrollbarElement } from './extends-element'
import { ScrollbarThumb } from './thumb'

type SetTrackTypeMap = {
  vertical: 'width'
  horizontal: 'width' | 'height' | 'left' | 'top'
}

type SetTrackType<Direction extends ScrollbarDirection> = SetTrackTypeMap[Direction]

type CssVarMap = {
  vertical: Record<SetTrackTypeMap['vertical'], string>
  horizontal: Record<SetTrackTypeMap['horizontal'], string>
}

export class ScrollbarTrack<
  Direction extends ScrollbarDirection = 'vertical',
> extends ScrollbarElement {
  thumb: ScrollbarThumb<Direction>

  calc: CalculateScrollThumb

  protected setChain: SetChain<Direction>
  set: SetChain<Direction>['set']

  constructor({
    direction,
    view,
    calc,
  }: {
    direction: Direction
    view: EditorView
    calc: CalculateScrollThumb
  }) {
    super({ direction, view })

    this.element.classList.add(
      SCROLL_BAR_CLASSNAME.TRACK,
      direction === 'vertical'
        ? SCROLL_BAR_CLASSNAME.VERTICAL_TRACK
        : SCROLL_BAR_CLASSNAME.HORIZONTAL_TRACK,
    )

    this.calc = calc

    this.element.append(
      (this.thumb = new ScrollbarThumb<Direction>({ direction, view, track: this, calc })).element,
    )

    this.setChain = new SetChain(this)
    this.set = this.setChain.set.bind(this.setChain)

    this.assignEvents()
  }

  protected assignEvents() {
    this.eventManager.addEventHandler('mousedown', (e) => {
      if (this.direction === 'vertical') {
        const { clientHeight: scrollDomClientHeight, scrollHeight: scrollDomScrollHeight } =
          this.view.scrollDOM

        if (scrollDomClientHeight === scrollDomScrollHeight) return

        const scrollTop = scrollDomScrollHeight * (e.offsetY / this.element.clientHeight)
        const centerOfVerticalThumb = scrollTop - scrollDomClientHeight / 2

        this.view.scrollDOM.scroll({
          top: centerOfVerticalThumb,
        })

        return
      }

      const { clientWidth: scrollDomClientWidth, scrollWidth: scrollDomScrollWidth } =
        this.view.scrollDOM

      if (scrollDomClientWidth === scrollDomScrollWidth) return

      const scrollLeft = scrollDomScrollWidth * (e.offsetX / this.element.clientWidth)
      const centerOfHorizontalThumb = scrollLeft - scrollDomClientWidth / 2

      this.view.scrollDOM.scroll({
        left: centerOfHorizontalThumb,
      })
    })
  }

  clear(): void {
    super.clear()

    this.thumb.clear()
  }
}

class SetChain<Direction extends ScrollbarDirection> {
  #track: ScrollbarTrack<Direction>

  constructor(track: ScrollbarTrack<Direction>) {
    this.#track = track
  }

  set<D extends ScrollbarDirection = Direction>(type: SetTrackType<D>, value: number) {
    const cssVarMap: CssVarMap = {
      vertical: {
        width: SCROLL_BAR_CSS_VARS.VERTICAL_TRACK_WIDTH,
      },
      horizontal: {
        width: SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_WIDTH,
        height: SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_HEIGHT,
        left: SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_LEFT,
        top: SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_TOP,
      },
    }

    this.#track.element.style.setProperty(
      cssVarMap[this.#track.direction][
        type as SetTrackType<'horizontal'> & SetTrackType<'vertical'>
      ],
      `${value}px`,
    )

    return this
  }
}
