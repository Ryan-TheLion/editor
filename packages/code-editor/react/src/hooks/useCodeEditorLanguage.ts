import { CodeEditorSupportedLanguage } from '@devrun_ryan/code-editor-core'
import { useContext, useEffect, useState } from 'react'

import { CodeEditorContext } from '../context'

export interface LanguageAction {
  changeLanguage: (language: CodeEditorSupportedLanguage) => void
}

export interface LanguagePayload {
  language: CodeEditorSupportedLanguage | null
  supported: CodeEditorSupportedLanguage[] | null
}

export interface UseCodeEditorLanguage {
  (): LanguagePayload & LanguageAction
}

export const useCodeEditorLanguage: UseCodeEditorLanguage = () => {
  const context = useContext(CodeEditorContext)

  const [language, setLanguage] = useState<CodeEditorSupportedLanguage | null>(
    context?.editor ? context.editor.language : null,
  )

  const changeLanguage = (language: CodeEditorSupportedLanguage) => {
    if (!context?.editor) return
    if (context.editor.language === language) return

    context.editor.changeLanguage(language)

    setLanguage(context.editor.language)
  }

  useEffect(() => {
    if (!context?.editor) return

    setLanguage(context.editor.language)
  }, [context])

  return {
    language,
    changeLanguage,
    supported: context?.editor
      ? ([...Object.keys(context.editor.editorLanguages)] as CodeEditorSupportedLanguage[])
      : null,
  }
}
