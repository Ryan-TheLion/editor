import {
  CodeMirrorEditorDefaultLanguages,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorViewer,
  CodeMirrorEditorViewerProps,
  HeightValue,
} from '@devrun_ryan/code-editor-core'
import { CodeMirrorViewerProps } from '../editor'
import { useImperativeHandle, useLayoutEffect, useMemo, useState } from 'react'

type Status = 'loading' | 'done'

type ExcludeKeys<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> = keyof Pick<CodeMirrorViewerProps<Languages, MaxHeightValue>, 'loadingFallback' | 'children'>

export interface UseInitCodeMirrorViewerProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends Omit<CodeMirrorViewerProps<Languages, MaxHeightValue>, ExcludeKeys> {}

const createCodeMirrorViewer = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  content,
  starterKit,
  extensions,
  onDestroy,
  ...props
}: Omit<
  CodeMirrorViewerProps<Languages, MaxHeightValue>,
  'ref' | 'fetchPayload' | 'loadingFallback' | 'children'
>) => {
  return new CodeMirrorEditorViewer<Languages, MaxHeightValue>({
    extensions: starterKit ? CodeMirrorEditorViewer.starterKit : extensions,
    content,
    onDestroy,
    ...props,
  })
}

export const useInitCodeMirrorViewer = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  ref,
  languages,
  content,
  fetchPayload,
  starterKit,
  extensions,
  onDestroy,
  ...props
}: UseInitCodeMirrorViewerProps<Languages, MaxHeightValue>) => {
  const [viewer, setViewer] = useState<CodeMirrorEditorViewer<Languages, MaxHeightValue> | null>(
    null,
  )
  const [status, setStatus] = useState<Status>('loading')

  const viewerPayload = useMemo<{
    viewer: CodeMirrorEditorViewer<Languages, MaxHeightValue> | null
    status: Status
  }>(() => {
    return {
      viewer,
      status,
    }
  }, [viewer, status])

  useImperativeHandle(ref, () => viewer!, [viewer])

  useLayoutEffect(() => {
    const initViewer = ({
      content,
      language,
    }: Pick<CodeMirrorEditorViewerProps<Languages, MaxHeightValue>, 'content' | 'language'>) => {
      const viewer = createCodeMirrorViewer<Languages, MaxHeightValue>({
        ...props,
        content,
        languages,
        language: language ?? props.language,
        starterKit,
        extensions,
        onDestroy,
      })

      setViewer(viewer)
      setStatus('done')
    }

    // init

    if (fetchPayload) {
      fetchPayload().then(({ content, language }) => {
        initViewer({
          content,
          language,
        })
      })

      return
    }

    initViewer({
      content: content ?? '',
    })
  }, [])

  useLayoutEffect(() => {
    viewer?.updateProps({ onDestroy })
  }, [onDestroy])

  return viewerPayload
}
