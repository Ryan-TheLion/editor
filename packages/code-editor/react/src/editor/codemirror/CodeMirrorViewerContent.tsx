import { HeightValue } from '@devrun_ryan/code-editor-core'
import { CodeMirrorContent, CodeMirrorEditorContentProps } from './CodeMirrorContent'

export interface CodeMirrorViewerContentProps<MaxHeightValue extends HeightValue = HeightValue>
  extends Omit<CodeMirrorEditorContentProps<MaxHeightValue>, 'fitContent'> {}

export const CodeMirrorViewerContent = <MaxHeightValue extends HeightValue = HeightValue>({
  ...props
}: CodeMirrorViewerContentProps<MaxHeightValue>) => {
  return <CodeMirrorContent fitContent={false} {...props} />
}
