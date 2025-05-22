import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

import { editorThemeMode } from '../theme/editor-theme'
import { facetChanged } from '../../../utils'

export const viewActiveLine = () => {
  return activeLine()
}

const lineDeco = Decoration.line({ class: 'cm-activeLine' })

const activeLine = () => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = this.getDeco({ view })
      }

      update(update: ViewUpdate) {
        if (!this.next(update)) return

        this.decorations = this.getDeco({
          view: update.view,
        })
      }

      next(update: ViewUpdate) {
        const changed = this.changed(update)

        if (
          !update.selectionSet &&
          !update.focusChanged &&
          Array.from(Object.values(changed)).every((c) => !c)
        )
          return false

        return true
      }

      changed(update: ViewUpdate) {
        const { editable, themeMode } = facetChanged(update, {
          editable: EditorView.editable,
          themeMode: editorThemeMode,
        })

        return {
          editable: editable.changed,
          themeMode: themeMode.changed,
        }
      }

      getDeco({ view }: { view: EditorView }) {
        const editable = view.state.facet(EditorView.editable.reader)

        if (!editable) return Decoration.none
        if (!view.hasFocus) return Decoration.none

        let lastLineStart = -1
        const deco = []

        const range = view.state.selection.asSingle().ranges[0]

        if (!range) return Decoration.none

        const collapsed = range.from === range.to
        if (!collapsed) {
          return Decoration.none
        }

        for (const range of view.state.selection.ranges) {
          const line = view.lineBlockAt(range.head)

          if (line.from > lastLineStart) {
            deco.push(lineDeco.range(line.from))
            lastLineStart = line.from
          }
        }

        return Decoration.set(deco)
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  )
}
