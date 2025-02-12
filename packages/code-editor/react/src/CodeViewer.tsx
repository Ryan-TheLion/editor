import { CodeEditorContent } from '@devrun_ryan/code-editor-core'

import { CodeEditor, CodeEditorProps } from './CodeEditor'
import { CodeEditorContentProps } from './CodeEditorContent'

export interface CodeViewerProps
  extends Omit<
      CodeEditorProps,
      'view' | 'state' | 'editable' | 'autoFocus' | 'activeLineGutter' | 'children'
    >,
    CodeEditorContentProps {
  content: CodeEditorContent
}

export const CodeViewer = ({ content, width, height, starterKit, ...props }: CodeViewerProps) => {
  const config = {
    starterKit,
    ...props,
  }

  return (
    <CodeEditor editable={false} autoFocus={false} {...config}>
      <CodeEditor.Content content={content} width={width} height={height} />
    </CodeEditor>
  )
}
