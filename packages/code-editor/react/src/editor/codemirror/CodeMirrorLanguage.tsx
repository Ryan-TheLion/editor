import { CodeMirrorEditorLanguages } from '@devrun_ryan/code-editor-core'
import { useCodeMirrorEditorLanguage, UseCodeMirrorEditorLanguagePayload } from '../../hooks'

export interface CodeMirrorLanguageCallbackProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
> extends UseCodeMirrorEditorLanguagePayload<Languages> {}

export interface CodeMirrorLanguageProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
> {
  children: (props: CodeMirrorLanguageCallbackProps<Languages>) => React.ReactNode
}

export const CodeMirrorLanguage = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorLanguages<string>,
>({
  children,
}: CodeMirrorLanguageProps<Languages>) => {
  const { language, setLanguage, supportedLanguages } = useCodeMirrorEditorLanguage<Languages>()

  return children({ language, setLanguage, supportedLanguages })
}
