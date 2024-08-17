import { javascript } from '@codemirror/lang-javascript'
import { LanguageSupport } from '@codemirror/language'

export type CodeEditorSupportedLanguage = 'javascript' | 'typescript' | 'jsx' | 'tsx'

export type EditorLanguagePack = Record<CodeEditorSupportedLanguage, LanguageSupport>

export const CodeEditorLanguages: EditorLanguagePack = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  jsx: javascript({ jsx: true }),
  tsx: javascript({ jsx: true, typescript: true }),
}

export const CODE_EDITOR_DEFAULT_LANGUAGE: CodeEditorSupportedLanguage = 'javascript'
