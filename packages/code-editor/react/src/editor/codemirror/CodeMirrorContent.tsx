import {
  CodeMirrorEditorLanguages,
  CodeMirrorEditorProps,
  HeightValue,
} from '@devrun_ryan/code-editor-core'
import { useCallback, useEffect } from 'react'
import { useCodeMirrorEditor } from '../../hooks'

export interface CodeMirrorEditorContentProps<MaxHeightValue extends HeightValue = HeightValue>
  extends Pick<
    CodeMirrorEditorProps<CodeMirrorEditorLanguages<string>, MaxHeightValue>,
    'fitContent' | 'maxHeight'
  > {}

export const CodeMirrorContent = <MaxHeightValue extends HeightValue = HeightValue>({
  fitContent = false,
  maxHeight,
}: CodeMirrorEditorContentProps<MaxHeightValue>) => {
  const codeEditor = useCodeMirrorEditor()

  const contentDOM = useCallback(
    (element: HTMLDivElement | null) => {
      if (!codeEditor) return

      if (element && !document.contains(codeEditor.view.dom)) {
        codeEditor.updateProps({
          dom: element,
          ...(fitContent != null && { fitContent }),
          ...(maxHeight != null && { maxHeight }),
        })
      }
    },
    [codeEditor],
  )

  useEffect(() => {
    if (!codeEditor) return

    if (codeEditor.props.fitContent === fitContent) return

    codeEditor.updateProps({ fitContent })
  }, [codeEditor, fitContent])

  return <div ref={contentDOM} />
}
