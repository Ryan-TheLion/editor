import { EditorView } from '@codemirror/view'

import { EditorThemeMode } from '../../theme'
import { COLOR } from '../../theme/colors'
import { CONTENT_PADDING_BOTTOM, SCROLL_BAR_CLASSNAME } from './constants'
import { ScrollbarDirection } from './extension-scrollbar'
import { ScrollbarTrack } from './elements/track'
import { ScrollbarThumb } from './elements/thumb'

type ElementSelectorKey =
  | 'track'
  | 'thumb'
  | `thumb:${ThumbType}`
  | 'scrollDOM'
  | 'contentDOM'
  | 'editorDOM'

type ThumbType = 'show' | 'hide' | 'active'

type ScrollbarColor = {
  track: {
    bg: string
    border: string
  }
  thumb: {
    show: string
    hover: string
    active: string
  }
}

type ScrollbarColors = Record<ScrollbarDirection, ScrollbarColor>

export type ScrollbarThemeColors = Record<EditorThemeMode, ScrollbarColors>

export const scrollbarThemeColors: ScrollbarThemeColors = {
  light: {
    vertical: {
      track: {
        bg: COLOR.transparent,
        border: '#79797933',
      },
      thumb: {
        show: '#53a9ff33',
        hover: '#53a9ff66',
        active: '#53a9ffff',
      },
    },
    horizontal: {
      track: {
        bg: COLOR.transparent,
        border: COLOR.transparent,
      },
      thumb: {
        show: '#53a9ff33',
        hover: '#53a9ff66',
        active: '#53a9ffff',
      },
    },
  },
  dark: {
    vertical: {
      track: {
        bg: COLOR.transparent,
        border: '#d1e6fc33',
      },
      thumb: {
        show: '#53a9ff33',
        hover: '#53a9ff66',
        active: '#53a9ffff',
      },
    },
    horizontal: {
      track: {
        bg: COLOR.transparent,
        border: COLOR.transparent,
      },
      thumb: {
        show: '#53a9ff33',
        hover: '#53a9ff66',
        active: '#53a9ffff',
      },
    },
  },
}

const SELECTOR = {
  theme: (theme: EditorThemeMode | null) => {
    const base = theme === null ? `&` : `&${theme}`

    return `${base}.${SCROLL_BAR_CLASSNAME.scrollbar}`
  },
  track: ({ direction }: { direction?: ScrollbarDirection }) => {
    const base = `.${SCROLL_BAR_CLASSNAME.track}`

    const directionSelector = ((direction?: ScrollbarDirection) => {
      if (!direction) return ''

      return `.${direction === 'horizontal' ? SCROLL_BAR_CLASSNAME.horizontalTrack : SCROLL_BAR_CLASSNAME.verticalTrack}`
    })(direction)

    return `${base}${directionSelector}`
  },
  thumb: ({ direction, type }: { direction?: ScrollbarDirection; type?: ThumbType } = {}) => {
    const base = `.${SCROLL_BAR_CLASSNAME.thumb}`

    const directionSelector = ((direction?: ScrollbarDirection) => {
      if (!direction) return ''

      return `.${direction === 'horizontal' ? SCROLL_BAR_CLASSNAME.horizontalThumb : SCROLL_BAR_CLASSNAME.verticalThumb}`
    })(direction)

    const typeSelector = ((type?: ThumbType) => {
      if (!type) return ''

      if (type === 'show') return `.${SCROLL_BAR_CLASSNAME.thumbShow}`
      if (type === 'hide') return `.${SCROLL_BAR_CLASSNAME.thumbHide}`

      return `.${SCROLL_BAR_CLASSNAME.thumbActive}`
    })(type)

    return `${base}${directionSelector}${typeSelector}`
  },
  scrollDOM: '.cm-scroller',
  contentDOM: '.cm-content',
}

const DATA_SET = {
  overflow: {
    horizontal: (overflow: boolean) =>
      `[data-overflow-horizontal="${overflow ? 'true' : 'false'}"]`,
    vertical: (overflow: boolean) => `[data-overflow-vertical="${overflow ? 'true' : 'false'}"]`,
  },
}

export const scrollbarStyleSelector = ({
  type,
  overflow,
  direction,
  themeMode,
}: {
  type: ElementSelectorKey
  overflow?: Partial<Record<ScrollbarDirection, boolean>>
  direction?: ScrollbarDirection
  themeMode?: EditorThemeMode
}) => {
  const base = SELECTOR.theme(themeMode ?? null)

  const overflowDataSet = ((overflow?: Partial<Record<ScrollbarDirection, boolean>>) => {
    let dataSet = ''

    if (typeof overflow?.horizontal === 'boolean')
      dataSet = `${dataSet}${DATA_SET.overflow.horizontal(overflow.horizontal)}`
    if (typeof overflow?.vertical === 'boolean')
      dataSet = `${dataSet}${DATA_SET.overflow.vertical(overflow.vertical)}`

    return dataSet
  })(overflow)

  if (type === 'editorDOM') return `${base}${overflowDataSet}`

  const typeSelector = (({
    type,
    direction,
  }: {
    type: ElementSelectorKey
    direction?: ScrollbarDirection
  }) => {
    if (type === 'track') return SELECTOR.track({ direction })
    if (type.startsWith('thumb'))
      return SELECTOR.thumb({ type: type.split(':')[1] as ThumbType | undefined, direction })
    if (type === 'scrollDOM') return SELECTOR.scrollDOM

    return SELECTOR.contentDOM
  })({ type, direction })

  return `${base}${overflowDataSet} ${typeSelector}`
}

export const scrollbarTheme = ({ colors }: { colors: ScrollbarThemeColors }) => {
  return EditorView.baseTheme({
    // editor
    [scrollbarStyleSelector({ type: 'editorDOM' })]: {
      position: 'relative !important',
    },
    // contentDOM
    [scrollbarStyleSelector({ type: 'contentDOM', overflow: { horizontal: true } })]: {
      paddingBottom: `${CONTENT_PADDING_BOTTOM}px`,
    },
    // scrollDOM
    [scrollbarStyleSelector({ type: 'scrollDOM' })]: {
      overflow: 'auto',
      scrollbarWidth: 'none',
      '-ms-overflow-style': 'none',
    },
    [`${scrollbarStyleSelector({ type: 'scrollDOM' })}::-webkit-scrollbar`]: {
      display: 'none',
    },
    [scrollbarStyleSelector({
      type: 'scrollDOM',
      overflow: { horizontal: true, vertical: false },
    })]: {
      overscrollBehavior: 'none auto',
    },
    [scrollbarStyleSelector({
      type: 'scrollDOM',
      overflow: { horizontal: false, vertical: true },
    })]: {
      overscrollBehavior: 'auto none',
    },
    [scrollbarStyleSelector({ type: 'scrollDOM', overflow: { horizontal: true, vertical: true } })]:
      {
        overscrollBehavior: 'none',
      },
    // track common
    [scrollbarStyleSelector({ type: 'track' })]: {
      boxSizing: 'border-box',
      flexShrink: 0,
      zIndex: 151,
      transition: 'border-color 0.2s',
      overflow: 'hidden',
    },
    // thumb common
    [scrollbarStyleSelector({ type: 'thumb:hide' })]: {
      backgroundColor: COLOR.transparent,
    },
    // horizontal track
    [scrollbarStyleSelector({ type: 'track', direction: 'horizontal', themeMode: 'light' })]: {
      position: 'absolute',
      left: ScrollbarTrack.initialCssVars.varFormat('hs-track-left'),
      top: ScrollbarTrack.initialCssVars.varFormat('hs-track-top'),
      width: ScrollbarTrack.initialCssVars.varFormat('hs-track-width'),
      height: ScrollbarTrack.initialCssVars.varFormat('hs-track-height'),
      transform: `translateY(-100%)`,
      color: COLOR.transparent,
      borderTop: `1px solid ${colors.light.horizontal.track.border}`,
      backgroundColor: colors.light.horizontal.track.bg,
    },
    [scrollbarStyleSelector({ type: 'track', direction: 'horizontal', themeMode: 'dark' })]: {
      position: 'absolute',
      left: ScrollbarTrack.initialCssVars.varFormat('hs-track-left'),
      top: ScrollbarTrack.initialCssVars.varFormat('hs-track-top'),
      width: ScrollbarTrack.initialCssVars.varFormat('hs-track-width'),
      height: ScrollbarTrack.initialCssVars.varFormat('hs-track-height'),
      transform: `translateY(-100%)`,
      color: COLOR.transparent,
      borderTop: `1px solid ${colors.dark.horizontal.track.border}`,
      backgroundColor: colors.dark.horizontal.track.bg,
    },
    [scrollbarStyleSelector({
      type: 'track',
      direction: 'horizontal',
      overflow: { horizontal: false },
    })]: {
      borderTop: `0px solid ${COLOR.transparent}`,
    },
    [`${scrollbarStyleSelector({ type: 'track', direction: 'horizontal', overflow: { horizontal: true } })}:has(.${SCROLL_BAR_CLASSNAME.thumbHide})`]:
      {
        borderTop: `1px solid ${COLOR.transparent}`,
      },
    // horizontal thumb
    [scrollbarStyleSelector({ type: 'thumb', direction: 'horizontal' })]: {
      transform: `translateX(${ScrollbarThumb.initialCssVars.varFormat('hs-thumb-left')})`,
      transition: 'background-color 0.2s',
      width: ScrollbarThumb.initialCssVars.varFormat('hs-thumb-width'),
      height: '100%',
    },
    [scrollbarStyleSelector({ type: 'thumb:show', direction: 'horizontal', themeMode: 'light' })]: {
      backgroundColor: colors.light.horizontal.thumb.show,
    },
    [scrollbarStyleSelector({ type: 'thumb:show', direction: 'horizontal', themeMode: 'dark' })]: {
      backgroundColor: colors.dark.horizontal.thumb.show,
    },
    [`${scrollbarStyleSelector({ type: 'thumb:show', direction: 'horizontal', themeMode: 'light' })}:hover`]:
      {
        backgroundColor: colors.light.horizontal.thumb.hover,
      },
    [`${scrollbarStyleSelector({ type: 'thumb:show', direction: 'horizontal', themeMode: 'dark' })}:hover`]:
      {
        backgroundColor: colors.dark.horizontal.thumb.hover,
      },
    [`${scrollbarStyleSelector({ type: 'thumb:active', direction: 'horizontal', themeMode: 'light' })}`]:
      {
        backgroundColor: `${colors.light.horizontal.thumb.active} !important`,
      },
    [`${scrollbarStyleSelector({ type: 'thumb:active', direction: 'horizontal', themeMode: 'dark' })}`]:
      {
        backgroundColor: `${colors.dark.horizontal.thumb.active} !important`,
      },
    // vertical track
    [scrollbarStyleSelector({ type: 'track', direction: 'vertical', themeMode: 'light' })]: {
      position: 'sticky',
      right: 0,
      top: 0,
      width: ScrollbarTrack.initialCssVars.varFormat('vs-track-width'),
      height: ScrollbarTrack.initialCssVars.varFormat('vs-track-height'),
      color: COLOR.transparent,
      borderLeft: `1px solid ${colors.light.vertical.track.border}`,
      backgroundColor: colors.light.vertical.track.bg,
    },
    [scrollbarStyleSelector({ type: 'track', direction: 'vertical', themeMode: 'dark' })]: {
      position: 'sticky',
      right: 0,
      top: 0,
      width: ScrollbarTrack.initialCssVars.varFormat('vs-track-width'),
      height: ScrollbarTrack.initialCssVars.varFormat('vs-track-height'),
      color: COLOR.transparent,
      borderLeft: `1px solid ${colors.dark.vertical.track.border}`,
      backgroundColor: colors.dark.vertical.track.bg,
    },
    [scrollbarStyleSelector({
      type: 'track',
      direction: 'vertical',
      overflow: { vertical: false },
    })]: {
      borderLeft: `0px solid ${COLOR.transparent}`,
    },
    [`${scrollbarStyleSelector({ type: 'track', direction: 'vertical', overflow: { vertical: true } })}:has(.${SCROLL_BAR_CLASSNAME.thumbHide})`]:
      {
        borderLeft: `1px solid ${COLOR.transparent}`,
      },
    // vertical thumb
    [scrollbarStyleSelector({ type: 'thumb', direction: 'vertical' })]: {
      transform: `translateY(${ScrollbarThumb.initialCssVars.varFormat('vs-thumb-top')})`,
      transition: 'background-color 0.4s',
      width: '100%',
      height: ScrollbarThumb.initialCssVars.varFormat('vs-thumb-height'),
    },
    [scrollbarStyleSelector({ type: 'thumb:show', direction: 'vertical', themeMode: 'light' })]: {
      backgroundColor: colors.light.vertical.thumb.show,
    },
    [scrollbarStyleSelector({ type: 'thumb:show', direction: 'vertical', themeMode: 'dark' })]: {
      backgroundColor: colors.dark.vertical.thumb.show,
    },
    [`${scrollbarStyleSelector({ type: 'thumb:show', direction: 'vertical', themeMode: 'light' })}:hover`]:
      {
        backgroundColor: colors.light.vertical.thumb.hover,
      },
    [`${scrollbarStyleSelector({ type: 'thumb:show', direction: 'vertical', themeMode: 'dark' })}:hover`]:
      {
        backgroundColor: colors.dark.vertical.thumb.hover,
      },
    [scrollbarStyleSelector({ type: 'thumb:active', direction: 'vertical', themeMode: 'light' })]: {
      backgroundColor: `${colors.light.vertical.thumb.active} !important`,
    },
    [scrollbarStyleSelector({ type: 'thumb:active', direction: 'vertical', themeMode: 'dark' })]: {
      backgroundColor: `${colors.dark.vertical.thumb.active} !important`,
    },
  })
}

export const scrollbarHidden = () =>
  EditorView.baseTheme({
    // scrollDOM
    [scrollbarStyleSelector({ type: 'scrollDOM' })]: {
      overflow: 'auto',
      scrollbarWidth: 'none',
      '-ms-overflow-style': 'none',
    },
    [`${scrollbarStyleSelector({ type: 'scrollDOM' })}::-webkit-scrollbar`]: {
      display: 'none',
    },
  })
