import {
  CodeEditor as Editor,
  CodeEditorConstructorProps,
  Extension,
} from '@devrun_ryan/code-editor-core'

import { CodeEditorContent } from './CodeEditorContent'
import { CodeEditorContentListener } from './ContentListener'
import { CodeEditorContext } from './context'
import { useCodeEditor } from './hooks'
import { Language } from './Language'

export interface CodeEditorProps extends Omit<CodeEditorConstructorProps, 'dom' | 'content'> {
  starterKit?: boolean
  children: React.ReactNode
}

export const CodeEditor = ({ children, starterKit, extensions, ...props }: CodeEditorProps) => {
  const codeEditorExtensions: Extension[] | undefined = (({
    editorExtensions,
    starterKit,
  }: {
    editorExtensions?: Extension[]
    starterKit?: boolean
  }) => {
    if (starterKit) return Editor.starterKit

    if (!editorExtensions?.length) return undefined

    return editorExtensions
  })({ editorExtensions: extensions, starterKit })

  const { editor } = useCodeEditor({
    extensions: codeEditorExtensions,
    ...props,
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
