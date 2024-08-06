import { syntaxHighlighting } from '@codemirror/language'

import { editorDarkTheme, editorLightTheme } from './editor-theme'
import { codeEditorDarkThemeHighlight, codeEditorLightThemeHighlight } from './highlight-style'

export const lightTheme = [editorLightTheme, syntaxHighlighting(codeEditorLightThemeHighlight)]
export const darkTheme = [editorDarkTheme, syntaxHighlighting(codeEditorDarkThemeHighlight)]
