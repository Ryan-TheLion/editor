import { CssVarFields } from '../extension/extension-css-var/css-var'
import {
  codeEditorDarkThemeColors,
  codeEditorLightThemeColors,
  CodeEditorThemeColors,
  EditorColorCssVarFields,
} from './colors'
import { createEditorTheme } from './editor-theme'
import {
  codeEditorDarkThemeSyntaxHighlight,
  codeEditorLightThemeSyntaxHighlight,
} from './highlight-style'

export { type EditorThemeMap, type EditorThemeMode } from './editor-theme'

export type EditorCssVarFields<Colors extends CodeEditorThemeColors> = CssVarFields<
  {
    fontSize: `${number}px` | `${number}em` | `${number}rem`
  } & EditorColorCssVarFields<Colors['editor']>
>

export const lightTheme = createEditorTheme({
  themeMode: 'light',
  colors: codeEditorLightThemeColors,
  syntaxHighlightStyle: codeEditorLightThemeSyntaxHighlight(),
})

export const darkTheme = createEditorTheme({
  themeMode: 'dark',
  colors: codeEditorDarkThemeColors,
  syntaxHighlightStyle: codeEditorDarkThemeSyntaxHighlight(),
})
