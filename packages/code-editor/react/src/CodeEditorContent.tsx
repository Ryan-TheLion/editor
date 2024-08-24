import { CodeEditorContent as ContentType, CodeEditorState } from '@devrun_ryan/code-editor-core'
import { useContext, useEffect, useRef } from 'react'

import { CodeEditorContext } from './context'

export interface CodeEditorContentProps {
  width?: string
  height?: string
  content?: ContentType
}

export const CodeEditorContent = ({
  width = '100%',
  height = '100%',
  content,
}: CodeEditorContentProps) => {
  const context = useContext(CodeEditorContext)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!context?.editor) return
    if (!contentRef.current) return

    if (context.editor?.dom.parentElement !== contentRef.current) {
      context.editor?.attachDom(contentRef.current)
    }

    if (content && !isSameContent({ editorState: context.editor.view.state, content })) {
      const initialState = context.editor.initialState({
        content,
        extension: context.editor.extension,
      })

      context.editor.view.setState(initialState)
    }
  }, [context, content])

  return <div ref={contentRef} style={{ width, height }} />
}

const isSameContent = ({
  editorState,
  content,
}: {
  editorState: CodeEditorState
  content: ContentType
}) => {
  if (typeof content === 'string') {
    return editorState.doc.toString() === content
  }

  return editorState.toJSON() === content
}
