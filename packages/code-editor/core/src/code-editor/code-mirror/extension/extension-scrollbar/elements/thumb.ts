import { CssVarFields, CssVarManager } from '../../extension-css-var'
import { SCROLL_BAR_CLASSNAME } from '../constants'
import { ScrollbarDirection, ScrollbarState } from '../extension-scrollbar'
import { ScrollbarElement } from './extends-element'
import { ScrollbarTrack } from './track'

type HorizontalThumbCssVarFields = CssVarFields<{
  hsThumbLeft: `${number}px`
  hsThumbWidth: `${number}px`
}>

type VerticalThumbCssVarFields = CssVarFields<{
  vsThumbTop: `${number}px`
  vsThumbHeight: `${number}px`
}>

type ScrollbarThumbCssVarManager<Direction extends ScrollbarDirection> =
  Direction extends 'vertical'
    ? CssVarManager<VerticalThumbCssVarFields>
    : CssVarManager<HorizontalThumbCssVarFields>

const initialCssVars = CssVarManager.cssVars({
  'hs-thumb-left': '0px',
  'hs-thumb-width': '0px',
  'vs-thumb-top': '0px',
  'vs-thumb-height': '0px',
} as CssVarFields<HorizontalThumbCssVarFields & VerticalThumbCssVarFields>)

export class ScrollbarThumb<
  Direction extends ScrollbarDirection = 'vertical',
> extends ScrollbarElement<Direction> {
  #track: ScrollbarTrack<Direction>

  cssVarManager: ScrollbarThumbCssVarManager<Direction>

  constructor({
    track,
    scrollbarState,
  }: {
    track: ScrollbarTrack<Direction>
    scrollbarState: ScrollbarState
  }) {
    super({ direction: track.direction, view: track.view, scrollbarState })

    this.element.classList.add(
      SCROLL_BAR_CLASSNAME.thumb,
      track.direction === 'vertical'
        ? SCROLL_BAR_CLASSNAME.verticalThumb
        : SCROLL_BAR_CLASSNAME.horizontalThumb,
    )

    this.#track = track

    this.cssVarManager = ((): ScrollbarThumbCssVarManager<Direction> => {
      if (this.direction === 'vertical') {
        return new CssVarManager({
          fields: {
            'vs-thumb-top': initialCssVars.get('vs-thumb-top').value,
            'vs-thumb-height': initialCssVars.get('vs-thumb-height').value,
          } as CssVarFields<VerticalThumbCssVarFields>,
          targetDOM: this.element,
        }) as ScrollbarThumbCssVarManager<Direction>
      }

      return new CssVarManager({
        fields: {
          'hs-thumb-left': initialCssVars.get('hs-thumb-left').value,
          'hs-thumb-width': initialCssVars.get('hs-thumb-width').value,
        } as CssVarFields<HorizontalThumbCssVarFields>,
        targetDOM: this.element,
      }) as ScrollbarThumbCssVarManager<Direction>
    })()
  }

  get track() {
    return this.#track
  }

  assignEvents = null

  /** @internal */
  static initialCssVars = initialCssVars

  show() {
    this.element.classList.remove(SCROLL_BAR_CLASSNAME.thumbHide)
    this.element.classList.add(SCROLL_BAR_CLASSNAME.thumbShow)
  }

  hide() {
    this.element.classList.remove(SCROLL_BAR_CLASSNAME.thumbShow)
    this.element.classList.add(SCROLL_BAR_CLASSNAME.thumbHide)
  }

  active(isActive?: boolean) {
    this.element.classList.toggle(SCROLL_BAR_CLASSNAME.thumbActive, isActive)
  }
}
