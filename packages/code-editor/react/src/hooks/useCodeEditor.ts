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

export const useCodeEditor: UseCodeEditor = ({
  content,
  theme,
  extraExtensions,
  extraFields,
  ...props
} = {}) => {
  const [editor, setEditor] = useState<CodeEditor | null>(null)

  useEffect(() => {
    if (!editor) {
      const editor = createEditor({ content, theme, extraExtensions, extraFields, ...props })
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

const createEditor = ({
  content,
  theme,
  extraExtensions,
  extraFields,
  ...props
}: UseCodeEditorProps = {}) => {
  return new CodeEditor({
    content,
    theme,
    extraExtensions,
    extraFields,
    ...props,
  })
}
