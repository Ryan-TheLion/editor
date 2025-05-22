import { EditorCompartments } from '../editor'
import {
  CodeMirrorEditorDefaultLanguages,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorLanguagesKey,
  editorLanguage,
  editorLanguages,
} from '../languages'
import { EditorState, StateEffect } from '@codemirror/state'

export const languageExtension = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
>({
  compartment,
  languages,
  language,
}: {
  compartment: Pick<EditorCompartments, 'languages' | 'language'>
  languages: Languages
  language: CodeMirrorEditorLanguagesKey<Languages>
}) => {
  return [
    // Languages 초기화
    compartment.languages.of(editorLanguages.of(languages)),
    // Language 초기화
    compartment.language.name.of(editorLanguage.of(language as string)),
    // LanguageSupport 초기화
    compartment.language.support.of(languages[language]!),
    // LanguageSupport 업데이트
    EditorState.transactionExtender.of((tr) => {
      const effect = tr.effects.findLast((effect) => effect.is(updateLanguageEffect))

      if (!effect) return {}

      const currentLanguage = tr.state.facet(editorLanguage.reader)
      const expectedLanguage = effect.value

      if (currentLanguage === expectedLanguage) return {}

      const languages = tr.state.facet(editorLanguages)
      const languageSupport = languages[expectedLanguage]

      if (!languageSupport) return {}

      return {
        effects: [
          compartment.language.name.reconfigure(editorLanguage.of(expectedLanguage)),
          compartment.language.support.reconfigure(languageSupport),
        ],
      }
    }),
  ]
}

export const updateLanguageEffect = StateEffect.define<string>()
