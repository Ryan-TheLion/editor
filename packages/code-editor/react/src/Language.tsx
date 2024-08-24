import { LanguageAction, LanguagePayload, useCodeEditorLanguage } from './hooks'

export interface LanguageCallbackProps extends LanguagePayload, LanguageAction {}

export interface LanguageProps {
  children: (props: LanguageCallbackProps) => React.ReactNode
}

export const Language = ({ children }: LanguageProps) => {
  const { language, changeLanguage, supported } = useCodeEditorLanguage()

  return children({ language, changeLanguage, supported })
}
