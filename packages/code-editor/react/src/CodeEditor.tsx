import { CodeEditorConstructorProps } from '@devrun_ryan/code-editor-core'
import {
  firaCodeFont,
  lineHighlight,
  lineHighlightFields,
  prettierCode,
  scrollbar,
} from '@devrun_ryan/code-editor-core/extension'

import { CodeEditorContent } from './CodeEditorContent'
import { CodeEditorContentListener } from './ContentListener'
import { CodeEditorContext } from './context'
import { useCodeEditor } from './hooks'
import { Language } from './Language'

export interface StarterKit {
  theme: CodeEditorConstructorProps['theme']
  extraExtensions: CodeEditorConstructorProps['extraExtensions']
  extraFields: CodeEditorConstructorProps['extraFields']
  lineWrapping: true
}

export interface CodeEditorProps extends Omit<CodeEditorConstructorProps, 'dom' | 'content'> {
  starterKit?: boolean
  children: React.ReactNode
}

export const starterKitConfig: StarterKit = {
  theme: 'dark',
  extraExtensions: [firaCodeFont(), scrollbar(), prettierCode(), lineHighlight()],
  extraFields: {
    ...lineHighlightFields,
  },
  lineWrapping: true,
}

export const CodeEditor = ({
  theme,
  extraExtensions,
  extraFields,
  starterKit,
  children,
  ...props
}: CodeEditorProps) => {
  const { editor } = useCodeEditor({
    theme,
    extraExtensions,
    extraFields,
    ...props,
    ...(starterKit && {
      ...starterKitConfig,
    }),
  })

  return (
    <CodeEditorContext.Provider value={{ editor }}>
      <div>{children}</div>
    </CodeEditorContext.Provider>
  )
}

CodeEditor.Content = CodeEditorContent
CodeEditor.ContentListener = CodeEditorContentListener
CodeEditor.Language = Language
