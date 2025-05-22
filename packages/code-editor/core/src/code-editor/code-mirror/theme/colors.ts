import { PrefixVarFields } from '../extension/extension-css-var'
import { camelToKebab, flattenObject } from '../../../utils'

export type EditorColors = {
  bg: string
  font: string
  activeLine: string
  selection: string
  gutter: {
    bg: string
    font: string
  }
  activeGutter: {
    bg: string
    font: string
  }
  cursor: string
}

export type EditorColorCssVarFields<Colors extends EditorColors = EditorColors> = PrefixVarFields<
  'color',
  Colors
>

export interface CodeEditorThemeColors {
  editor: EditorColors
}

export const kababCaseKeyEditorColors = <Colors extends EditorColors>(colors: Colors) => {
  return flattenObject(colors, {
    prefix: 'color',
    seperator: '-',
    parseKey(key) {
      return camelToKebab(key)
    },
  }) as EditorColorCssVarFields<Colors>
}

export const COLOR = {
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
} as const

export const codeEditorLightThemeColors: CodeEditorThemeColors = {
  editor: {
    bg: COLOR.white,
    font: '#333333',
    activeLine: '#dedede4d',
    selection: '#dcf7f6',
    gutter: {
      bg: '#fcfcfc',
      font: '#b0b0b0',
    },
    activeGutter: {
      bg: COLOR.transparent,
      font: '#4f4f4f',
    },
    cursor: COLOR.black,
  },
}

export const codeEditorDarkThemeColors: CodeEditorThemeColors = {
  editor: {
    bg: '#001d42',
    font: '#6c6783',
    activeLine: '#6f74804d',
    selection: '#1d3b53',
    gutter: {
      bg: '#001d42',
      font: '#4b6479',
    },
    activeGutter: {
      bg: '#001d42',
      font: '#c5e4fd',
    },
    cursor: '#ffad5c',
  },
}
