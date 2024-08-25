import { CodeEditorContent } from '@devrun_ryan/code-editor-core'
import { firaCodeFont, lineHighlight, scrollbar } from '@devrun_ryan/code-editor-core/extension'

import { CodeEditor, CodeEditorProps, StarterKit, starterKitConfig } from './CodeEditor'
import { CodeEditorContentProps } from './CodeEditorContent'

export interface ViewerStarterKit extends StarterKit {}

export interface CodeViewerProps
  extends Omit<
      CodeEditorProps,
      'view' | 'state' | 'editable' | 'autoFocus' | 'activeLineGutter' | 'children'
    >,
    CodeEditorContentProps {
  content: CodeEditorContent
}

const starterKitViewerConfig: ViewerStarterKit = {
  ...starterKitConfig,
  extraExtensions: [firaCodeFont(), scrollbar(), lineHighlight()],
}

export const CodeViewer = ({ content, width, height, starterKit, ...props }: CodeViewerProps) => {
  const config = {
    ...props,
    ...(starterKit && { ...starterKitViewerConfig }),
    activeLineGutter: false,
  }

  return (
    <CodeEditor editable={false} autoFocus={false} {...config}>
      <CodeEditor.Content content={content} width={width} height={height} />
    </CodeEditor>
  )
}
