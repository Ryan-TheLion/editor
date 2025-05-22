import { AnyCodeMirrorEditor } from '@devrun_ryan/code-editor-core'
import { useCodeMirrorEditorAtomValue } from '../store'

export const useCodeMirrorEditor = <Editor extends AnyCodeMirrorEditor = AnyCodeMirrorEditor>() => {
  const editor = useCodeMirrorEditorAtomValue('editor') as Editor

  return editor
}
