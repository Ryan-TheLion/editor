export const CONTENT_PADDING_BOTTOM = 30

export const SCROLL_BAR_CSS_VARS = {
  VERTICAL_THUMB_LEFT: '--cm-vs-thumb-left',
  VERTICAL_THUMB_TOP: '--cm-vs-thumb-top',
  VERTICAL_TRACK_WIDTH: '--cm-vs-track-width',
  VERTICAL_THUMB_HEIGHT: '--cm-vs-thumb-height',
  HORIZONTAL_TRACK_LEFT: '--cm-hs-track-left',
  HORIZONTAL_TRACK_TOP: '--cm-hs-track-top',
  HORIZONTAL_TRACK_WIDTH: '--cm-hs-track-width',
  HORIZONTAL_TRACK_HEIGHT: '--cm-hs-track-height',
  HORIZONTAL_THUMB_LEFT: '--cm-hs-thumb-left',
  HORIZONTAL_THUMB_WIDTH: '--cm-hs-thumb-width',
}

export const SCROLL_BAR_CLASSNAME = {
  EDITOR: 'cm-editor',
  SCROLL_BAR: 'cm-scrollbar',
  TRACK: 'cm-scrollbar__track',
  HORIZONTAL_TRACK: 'cm-scrollbar__track--horizontal',
  VERTICAL_TRACK: 'cm-scrollbar__track--vertical',
  THUMB: 'cm-scrollbar__thumb',
  HORIZONTAL_THUMB: 'cm-scrollbar__thumb--horizontal',
  VERTICAL_THUMB: 'cm-scrollbar__thumb--vertical',
  THUMB_ACTIVE: 'cm-scrollbar__thumb--active',
}

export const SCROLL_BAR_SELECTOR = {
  EDITOR_WITH_SCROLL_BAR: `&.${SCROLL_BAR_CLASSNAME.EDITOR}.${SCROLL_BAR_CLASSNAME.SCROLL_BAR}`,
  get TRACK() {
    return `${this.EDITOR_WITH_SCROLL_BAR} .${SCROLL_BAR_CLASSNAME.TRACK}`
  },
  get HORIZONTAL_TRACK() {
    return `${this.TRACK}.${SCROLL_BAR_CLASSNAME.HORIZONTAL_TRACK}`
  },
  get VERTICAL_TRACK() {
    return `${this.TRACK}.${SCROLL_BAR_CLASSNAME.VERTICAL_TRACK}`
  },
  get THUMB() {
    return `${this.TRACK} .${SCROLL_BAR_CLASSNAME.THUMB}`
  },
  get HORIZONTAL_THUMB() {
    return `${this.THUMB}.${SCROLL_BAR_CLASSNAME.HORIZONTAL_THUMB}`
  },
  get VERTICAL_THUMB() {
    return `${this.THUMB}.${SCROLL_BAR_CLASSNAME.VERTICAL_THUMB}`
  },
}
