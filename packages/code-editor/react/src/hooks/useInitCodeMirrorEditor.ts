import {
  CodeMirrorEditor,
  CodeMirrorEditorDefaultLanguages,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorProps,
  HeightValue,
} from '@devrun_ryan/code-editor-core'
import { CodeMirrorProps } from '../editor'
import { useImperativeHandle, useLayoutEffect, useMemo, useState } from 'react'

type Status = 'loading' | 'done'

export interface UseInitCodeMirrorEditorProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends Omit<CodeMirrorProps<Languages, MaxHeightValue>, 'loadingFallback' | 'children'> {}

const createCodeMirrorEditor = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  content,
  starterKit,
  extensions,
  disableTransaction,
  onChange,
  onDestroy,
  ...props
}: Omit<
  CodeMirrorProps<Languages, MaxHeightValue>,
  'ref' | 'fetchPayload' | 'loadingFallback' | 'children'
>) => {
  return new CodeMirrorEditor<Languages, MaxHeightValue>({
    extensions: starterKit ? CodeMirrorEditor.starterKit : extensions,
    content,
    disableTransaction,
    onChange,
    onDestroy,
    ...props,
  })
}

export const useInitCodeMirrorEditor = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  ref,
  languages,
  content,
  fetchPayload,
  starterKit,
  extensions,
  disableTransaction,
  onChange,
  onDestroy,
  ...props
}: UseInitCodeMirrorEditorProps<Languages, MaxHeightValue> = {}) => {
  const [editor, setEditor] = useState<CodeMirrorEditor<Languages, MaxHeightValue> | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  const editorPayload = useMemo<{
    editor: CodeMirrorEditor<Languages, MaxHeightValue> | null
    status: Status
  }>(() => {
    return {
      editor,
      status,
    }
  }, [editor, status])

  useImperativeHandle(ref, () => editor!, [editor])

  useLayoutEffect(() => {
    const initEditor = ({
      content,
      language,
    }: Pick<CodeMirrorEditorProps<Languages, MaxHeightValue>, 'content' | 'language'>) => {
      const editor = createCodeMirrorEditor<Languages, MaxHeightValue>({
        ...props,
        content,
        languages,
        language: language ?? props.language,
        starterKit,
        extensions,
        disableTransaction,
        onChange,
        onDestroy,
      })

      setEditor(editor)
      setStatus('done')
    }

    // init

    if (fetchPayload) {
      fetchPayload().then(({ content, language }) => {
        initEditor({
          content,
          language,
        })
      })

      return
    }

    initEditor({
      content: content ?? '',
    })
  }, [])

  useLayoutEffect(() => {
    editor?.updateProps({
      onChange,
      onDestroy,
    })
  }, [onChange, onDestroy])

  return editorPayload
}
