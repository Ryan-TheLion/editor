import { LanguageSupport } from '@codemirror/language'
import { jsLanguageSupports } from './js'
import { Facet } from '@codemirror/state'

export * from './js'

// TODO: 에디터 언어 추가 (html, css, json, python, ...)

export type JsLanguageName = 'javascript' | 'typescript' | 'jsx' | 'tsx'

type LanguageSupportMap<Key extends string> = Record<Key, LanguageSupport>

export type CodeMirrorEditorLanguages<Key extends string> = LanguageSupportMap<Key>

export type CodeMirrorEditorLanguagesKey<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
> = Languages extends CodeMirrorEditorLanguages<infer L> ? (L extends string ? L : never) : never

export type CodeMirrorEditorSupportedLanguages<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
> = CodeMirrorEditorLanguagesKey<Languages>[]

export type CodeMirrorEditorDefaultLanguages = CodeMirrorEditorLanguages<JsLanguageName>

export type CodeMirrorEditorDefaultLanguage =
  CodeMirrorEditorLanguagesKey<CodeMirrorEditorDefaultLanguages>

const codeMirrorEditorJsLanguages: CodeMirrorEditorLanguages<JsLanguageName> = {
  javascript: jsLanguageSupports.javascript,
  typescript: jsLanguageSupports.typescript,
  jsx: jsLanguageSupports.jsx,
  tsx: jsLanguageSupports.tsx,
}

export const codeMirrorEditorDefaultLanguages: CodeMirrorEditorDefaultLanguages = {
  ...codeMirrorEditorJsLanguages,
}

export const CODE_MIRROR_EDITOR_DEFAULT_LANGUAGE: CodeMirrorEditorDefaultLanguage = 'javascript'

export const editorLanguages = Facet.define<
  CodeMirrorEditorLanguages<string>,
  CodeMirrorEditorLanguages<string>
>({
  combine([languages]) {
    return languages ?? {}
  },
})

export const editorLanguage = Facet.define<string, string>({
  combine([language]) {
    return language!
  },
})
