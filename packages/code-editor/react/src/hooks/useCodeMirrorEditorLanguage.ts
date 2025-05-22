import { useCallback } from 'react'
import { useCodeMirrorEditorAtomValue } from '../store'
import {
  CodeMirrorEditor,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorLanguagesKey,
} from '@devrun_ryan/code-editor-core'

export interface UseCodeMirrorEditorLanguagePayload<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
> {
  language: CodeMirrorEditorLanguagesKey<Languages>
  setLanguage: (language: CodeMirrorEditorLanguagesKey<Languages>) => void
  supportedLanguages: CodeMirrorEditorLanguagesKey<Languages>[]
}

export const useCodeMirrorEditorLanguage = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
>(): UseCodeMirrorEditorLanguagePayload<Languages> => {
  const editor = useCodeMirrorEditorAtomValue('editor') as CodeMirrorEditor<
    CodeMirrorEditorLanguages<string>,
    any
  >

  const language = useCodeMirrorEditorAtomValue(
    'language',
  ) as UseCodeMirrorEditorLanguagePayload<Languages>['language']

  const supportedLanguages = useCodeMirrorEditorAtomValue(
    'supportedLanguages',
  ) as UseCodeMirrorEditorLanguagePayload<Languages>['supportedLanguages']

  const setLanguage: UseCodeMirrorEditorLanguagePayload<Languages>['setLanguage'] = useCallback(
    (language) => {
      if (!editor) return

      if (editor.language === language) return

      editor.setLanguage(language as any)
    },
    [editor],
  )

  return {
    language,
    setLanguage,
    supportedLanguages,
  }
}
