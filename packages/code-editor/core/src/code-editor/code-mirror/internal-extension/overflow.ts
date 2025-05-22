import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { CodeMirrorEditor } from '../editor'

export const overflow = () => {
  return ViewPlugin.fromClass(
    class Overflow implements PluginValue {
      constructor(view: EditorView) {
        this.setOverflowDataset(view)
      }

      update(update: ViewUpdate) {
        if (!update.geometryChanged && !update.heightChanged) return

        this.setOverflowDataset(update.view)
      }

      setOverflowDataset(view: EditorView) {
        const overflow = CodeMirrorEditor.hasOverflow(view)

        view.dom.dataset['overflowHorizontal'] = `${overflow.horizontal}`
        view.dom.dataset['overflowVertical'] = `${overflow.vertical}`
      }
    },
  )
}
