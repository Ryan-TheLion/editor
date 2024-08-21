import { Language } from '@codemirror/language'
import { CursorOptions } from 'prettier'
import * as prettierBabelPlugin from 'prettier/plugins/babel.js'
import * as prettierEsTreePlugin from 'prettier/plugins/estree.js'
import * as prettierTypeScriptPlugin from 'prettier/plugins/typescript.js'

import { CodeEditorSupportedLanguage } from '../../code-mirror'

export const getEditorLanguage = (
  languageFacet: Language | null,
): CodeEditorSupportedLanguage | null => {
  if (!languageFacet) return null

  const { name, parser } = languageFacet

  // @ts-ignore
  const source = parser?.dialect?.source

  if (name === 'javascript') {
    return source === 'jsx' ? 'jsx' : 'javascript'
  }

  if (name === 'typescript') {
    return source === 'jsx ts' ? 'tsx' : 'typescript'
  }

  return null
}

export const createPrettierPlugins = (language: CodeEditorSupportedLanguage) => {
  const plugins = [prettierEsTreePlugin]

  if (language === 'javascript' || language === 'jsx') plugins.push(prettierBabelPlugin)
  if (language === 'typescript' || language === 'tsx') plugins.push(prettierTypeScriptPlugin)

  return plugins
}

export const getPrettierParser = (
  language: CodeEditorSupportedLanguage | null,
): CursorOptions['parser'] => {
  if (!language) return

  if (language === 'javascript' || language === 'jsx') return 'babel'
  if (language === 'typescript' || language === 'tsx') return 'typescript'

  return
}
