import { CodeEditorContent } from '@devrun_ryan/code-editor-core'
import { useContext, useEffect, useState } from 'react'

import { CodeEditorContext } from '../context'

type Cleanup = () => void

export type CodeEditorContentFilter = 'text' | 'json'

export interface ContentPayload {
  content: CodeEditorContent | null
}

interface UseCodeEditorContentProps {
  contentType: CodeEditorContentFilter
}

interface UseCodeEditorContent {
  (props: UseCodeEditorContentProps): ContentPayload
}

export const useCodeEditorContent: UseCodeEditorContent = ({ contentType }) => {
  const context = useContext(CodeEditorContext)

  const [content, setContent] = useState<CodeEditorContent | null>(null)

  useEffect(() => {
    let cleanup: Cleanup | undefined

    if (!context?.editor) return
    if (cleanup) return

    cleanup = context.editor.subscribeUpdateListener((update) => {
      if (!update.docChanged) return

      setContent(contentType === 'text' ? context.editor?.toText() : context.editor?.toJSON())
    })

    return () => {
      cleanup && cleanup()
    }
  }, [contentType, context])

  return {
    content,
  }
}
