import { CodeEditor, CodeEditorContent } from '@devrun_ryan/code-editor-core'
import { useEffect, useState } from 'react'

import { CodeEditorProps } from '../'

interface EditorPayload {
  editor: CodeEditor | null
}

interface UseCodeEditorProps extends Omit<CodeEditorProps, 'children'> {
  content?: CodeEditorContent
}

interface UseCodeEditor {
  (props?: UseCodeEditorProps): EditorPayload
}

export const useCodeEditor: UseCodeEditor = ({ ...props } = {}) => {
  const [editor, setEditor] = useState<CodeEditor | null>(null)

  useEffect(() => {
    if (!editor) {
      const editor = createEditor({ ...props })
      setEditor(editor)

      return
    }

    return () => {
      editor.view.destroy()

      setEditor(null)
    }
  }, []) /* eslint-disable-line */

  return {
    editor,
  }
}

const createEditor = ({ ...props }: UseCodeEditorProps = {}) => {
  return new CodeEditor({
    ...props,
  })
}
