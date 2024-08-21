import { CodeEditorThemeColors } from '../../theme/colors'
import {
  CONTENT_PADDING_BOTTOM,
  SCROLL_BAR_CLASSNAME,
  SCROLL_BAR_CSS_VARS,
  SCROLL_BAR_SELECTOR,
} from './constants'

export const createScrollbarTheme = ({
  scrollbarColors,
}: {
  scrollbarColors: CodeEditorThemeColors['editor']['scrollbar']
}) => {
  return {
    '&.cm-editor .cm-content': {
      paddingBottom: `${CONTENT_PADDING_BOTTOM}px`,
    },
    '&.cm-editor .cm-scroller': {
      scrollPaddingRight: '14px',
    },
    [SCROLL_BAR_SELECTOR.EDITOR_WITH_SCROLL_BAR]: {
      position: 'relative',
    },
    [SCROLL_BAR_SELECTOR.TRACK]: {
      boxSizing: 'border-box',
      flexShrink: 0,
      zIndex: 151,
    },
    [SCROLL_BAR_SELECTOR.HORIZONTAL_TRACK]: {
      position: 'absolute',
      left: `var(${SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_LEFT})`,
      top: `var(${SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_TOP})`,
      width: `var(${SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_WIDTH})`,
      height: `var(${SCROLL_BAR_CSS_VARS.HORIZONTAL_TRACK_HEIGHT})`,
      borderStyle: 'solid',
      borderWidth: '1px 0 0 0',
      borderColor: `${scrollbarColors.horizontal.track.border} transparent transparent transparent`,
      transform: `translateY(-100%)`,
      backgroundColor: `${scrollbarColors.horizontal.track.bg}`,
    },
    [SCROLL_BAR_SELECTOR.VERTICAL_TRACK]: {
      position: 'sticky',
      right: 0,
      top: 0,
      width: `var(${SCROLL_BAR_CSS_VARS.VERTICAL_TRACK_WIDTH})`,
      height: '100%',
      borderStyle: `solid`,
      borderWidth: '0 0 0 1px',
      borderColor: `transparent transparent transparent ${scrollbarColors.vertical.track.border}`,
      backgroundColor: `${scrollbarColors.vertical.track.bg}`,
    },
    [SCROLL_BAR_SELECTOR.THUMB]: {
      opacity: '0.2',
      transition: 'opacity 0.2s',
    },
    [`${SCROLL_BAR_SELECTOR.THUMB}:hover`]: {
      opacity: '0.3',
    },
    [SCROLL_BAR_SELECTOR.HORIZONTAL_THUMB]: {
      transform: `translateX(var(${SCROLL_BAR_CSS_VARS.HORIZONTAL_THUMB_LEFT}, 0px))`,
      width_fallback: 0,
      width: `var(${SCROLL_BAR_CSS_VARS.HORIZONTAL_THUMB_WIDTH})`,
      height: '100%',
      backgroundColor: `${scrollbarColors.horizontal.thumb}`,
    },
    [`${SCROLL_BAR_SELECTOR.HORIZONTAL_THUMB}.${SCROLL_BAR_CLASSNAME.THUMB_ACTIVE}`]: {
      opacity: '0.3',
    },
    [SCROLL_BAR_SELECTOR.VERTICAL_THUMB]: {
      transform: `translateY(var(${SCROLL_BAR_CSS_VARS.VERTICAL_THUMB_TOP}))`,
      width: '100%',
      height_fallback: 0,
      height: `var(${SCROLL_BAR_CSS_VARS.VERTICAL_THUMB_HEIGHT})`,
      backgroundColor: `${scrollbarColors.vertical.thumb}`,
    },
    [`${SCROLL_BAR_SELECTOR.VERTICAL_THUMB}.${SCROLL_BAR_CLASSNAME.THUMB_ACTIVE}`]: {
      opacity: '0.3',
    },
  }
}
