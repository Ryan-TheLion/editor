import { EditorView } from 'codemirror'

import { createScrollbarTheme } from '../extension/extension-scrollbar'
import { codeEditorDarkThemeColors, codeEditorLightThemeColors } from './colors'

export const editorLightTheme = EditorView.theme({
  '&': {
    backgroundColor: codeEditorLightThemeColors.editor.bg,
    fontWeight: 'bold',
    height: '100%',
    color: codeEditorLightThemeColors.editor.font,
    fontSize: '14px',
  },
  '&.cm-editor': {
    height: '100%',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  // scrollbar & scrollDom
  '& .cm-scroller': {
    overflow: 'auto',
    scrollbarWidth: 'none',
    '-ms-overflow-style': 'none',
    backgroundColor: codeEditorLightThemeColors.editor.bg,
  },
  '& .cm-scroller::-webkit-scrollbar': {
    display: 'none',
  },
  ...createScrollbarTheme({ scrollbarColors: codeEditorLightThemeColors.editor.scrollbar }),
  // gutter
  '.cm-gutters': {
    backgroundColor: codeEditorLightThemeColors.editor.gutter.bg,
    color: codeEditorLightThemeColors.editor.gutter.font,
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: codeEditorLightThemeColors.editor.activeGutter.bg,
    color: codeEditorLightThemeColors.editor.activeGutter.font,
  },
  // caret
  '.cm-content': {
    caretColor: codeEditorLightThemeColors.editor.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: codeEditorLightThemeColors.editor.cursor,
  },
  // active line
  '.cm-activeLine': {
    backgroundColor: codeEditorLightThemeColors.editor.activeLine,
  },
  // selection
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: codeEditorLightThemeColors.editor.selection },
  // matching bracket
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: codeEditorLightThemeColors.highlight.matchingBracket,
  },
})

export const editorDarkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: codeEditorDarkThemeColors.editor.bg,
      fontWeight: 'bold',
      height: '100%',
      color: codeEditorDarkThemeColors.editor.font,
      fontSize: '14px',
      overflow: 'hidden',
    },
    '&.cm-editor': {
      height: '100%',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    // scrollbar & scrollDom
    '& .cm-scroller': {
      overflow: 'auto',
      scrollbarWidth: 'none',
      '-ms-overflow-style': 'none',
      backgroundColor: codeEditorDarkThemeColors.editor.bg,
    },
    '& .cm-scroller::-webkit-scrollbar': {
      display: 'none',
    },
    ...createScrollbarTheme({ scrollbarColors: codeEditorDarkThemeColors.editor.scrollbar }),
    // gutter
    '.cm-gutters': {
      backgroundColor: codeEditorDarkThemeColors.editor.gutter.bg,
      color: codeEditorDarkThemeColors.editor.gutter.font,
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: codeEditorDarkThemeColors.editor.activeGutter.bg,
      color: codeEditorDarkThemeColors.editor.activeGutter.font,
    },
    // caret
    '.cm-content': {
      caretColor: codeEditorDarkThemeColors.editor.cursor,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: codeEditorDarkThemeColors.editor.cursor,
    },
    // active line
    '.cm-activeLine': {
      backgroundColor: codeEditorDarkThemeColors.editor.activeLine,
    },
    // selection
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: codeEditorDarkThemeColors.editor.selection },
    // matching bracket
    '&.cm-focused .cm-matchingBracket': {
      backgroundColor: codeEditorDarkThemeColors.highlight.matchingBracket,
    },
  },
  { dark: true },
)
