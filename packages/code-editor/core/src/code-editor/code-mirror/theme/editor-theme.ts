import { HighlightStyle, syntaxHighlighting, TagStyle } from '@codemirror/language'
import { EditorState, Extension, Facet } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { CodeEditorThemeColors } from './colors'
import { createEditorCssVarFields, CssVarManager } from '../extension/extension-css-var'

export type CodeMirrorStyleSpec = {
  [propOrSelector: string]: string | number | CodeMirrorStyleSpec | null
}

export type CodeMirrorThemeSpec = {
  [selector: string]: CodeMirrorStyleSpec
}

export type EditorThemeMode = 'light' | 'dark'

export type EditorThemeMap = {
  light: Extension
  dark: Extension
}

export type CreateThemeSpec = ({ colors }: { colors: CodeEditorThemeColors }) => CodeMirrorThemeSpec

const themeSpec: CreateThemeSpec = ({ colors }) => {
  const cssVarFields = createEditorCssVarFields(colors)
  const cssVars = CssVarManager.cssVars(cssVarFields)

  return {
    '&': {
      backgroundColor: cssVars.varFormat('color-bg'),
      height: '100%',
      color: cssVars.varFormat('color-font'),
      fontSize: cssVars.varFormat('font-size'),
    },
    '&.cm-editor': {
      height: 'auto',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-editor:not(.cm-focused) .cm-content[contenteditable="true"] ~ .cm-selectionLayer': {
      visibility: 'hidden',
    },
    // gutter
    '.cm-gutters': {
      backgroundColor: cssVars.varFormat('color-gutter-bg'),
      color: cssVars.varFormat('color-gutter-font'),
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: cssVars.varFormat('color-active-gutter-bg'),
      color: cssVars.varFormat('color-active-gutter-font'),
    },
    // caret
    '.cm-content': {
      caretColor: cssVars.varFormat('color-cursor'),
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: cssVars.varFormat('color-cursor'),
    },
    // active line
    '.cm-activeLine': {
      backgroundColor: cssVars.varFormat('color-active-line'),
    },
    // selection
    '&.cm-focused > .cm-scroller > .cm-selectionLayer > .cm-selectionBackground, & .cm-selectionBackground':
      {
        background: cssVars.varFormat('color-selection'),
      },
  }
}

export const createEditorTheme = ({
  themeMode,
  colors,
  syntaxHighlightStyle,
}: {
  themeMode: EditorThemeMode
  colors: CodeEditorThemeColors
  syntaxHighlightStyle: TagStyle[]
}) => {
  const themeExtension = EditorView.theme(themeSpec({ colors }), {
    dark: themeMode === 'dark',
  })

  const syntaxHighlight = HighlightStyle.define(syntaxHighlightStyle, {
    themeType: themeMode,
  })

  return [themeExtension, syntaxHighlighting(syntaxHighlight), editorColors.of(colors)]
}

const codeEditorThemeMode = ['light', 'dark'] as const

export const themeModeChanged = ({
  startState,
  state,
}: {
  startState: EditorState
  state: EditorState
}) => {
  return startState.facet(EditorView.darkTheme.reader) !== state.facet(EditorView.darkTheme.reader)
}

export const editorThemeMap = Facet.define<EditorThemeMap, EditorThemeMap | null>({
  combine([theme]) {
    if (!theme) return null

    return theme!
  },
})

export const editorThemeMode = Facet.define<EditorThemeMode, EditorThemeMode | null>({
  combine([themeMode]) {
    if (!codeEditorThemeMode.includes(themeMode as EditorThemeMode)) {
      return null
    }

    return themeMode!
  },
})

export const editorColors = Facet.define<CodeEditorThemeColors, CodeEditorThemeColors | null>({
  combine([colors]) {
    return colors ?? null
  },
})
