import { EditorView, PluginValue, ViewPlugin } from '@codemirror/view'
import { CodeMirrorEditor } from '../editor'
import { EditorContentPayload } from '../../../typing'
import { EditorState } from '@codemirror/state'

export const editorCallbackExtension = ({ editor }: { editor: CodeMirrorEditor<any, any> }) => {
  return [
    EditorState.transactionFilter.of((tr) => {
      // disableTransaction

      if (editor.props.disableTransaction?.(tr) === true) {
        return []
      }

      return tr
    }),
    EditorView.updateListener.of((update) => {
      // onChange

      if (!update.docChanged) return
      if (!editor.props.onChange) return

      const payload: EditorContentPayload = {
        text: editor.toText(),
        json: editor.toJSON(),
      }

      editor.props.onChange(payload)
    }),
    ViewPlugin.fromClass(
      class ListenDestroy implements PluginValue {
        // onDestroy

        view: EditorView

        constructor(view: EditorView) {
          this.view = view
        }

        destroy(): void {
          const view = this.view

          if (!document.contains(view.dom)) return
          if (!editor.props.onDestroy) return

          editor.props.onDestroy(view)
        }
      },
    ),
  ]
}
