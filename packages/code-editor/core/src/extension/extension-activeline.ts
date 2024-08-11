import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

interface ActiveLineOptions {
  hideInSelection: boolean
  hideHasNotFocus: boolean
}

export const viewActiveLine = ({
  hideInSelection = true,
  hideHasNotFocus = false,
}: Partial<ActiveLineOptions> = {}) => {
  return activeLine({ hideInSelection, hideHasNotFocus })
}

const lineDeco = Decoration.line({ class: 'cm-activeLine' })

const activeLine = ({ hideInSelection, hideHasNotFocus }: ActiveLineOptions) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        const isEdtiable = view.state.facet(EditorView.editable.reader)

        this.decorations =
          !isEdtiable || !view.hasFocus
            ? this.removeActiveLine()
            : this.setActiveLine({ view, hideInSelection })
      }

      update(update: ViewUpdate) {
        const isEditable = update.view.state.facet(EditorView.editable.reader)

        if (!isEditable) return this.removeActiveLine()

        if (!update.view.hasFocus) {
          if (hideHasNotFocus) return this.removeActiveLine()

          return
        }

        this.setActiveLine({ view: update.view, hideInSelection })
      }

      getDeco({ view, hideInSelection }: { view: EditorView; hideInSelection: boolean }) {
        let lastLineStart = -1
        const deco = []

        const range = view.state.selection.asSingle().ranges[0]
        if (!range) return Decoration.none

        const collapsed = range.from === range.to
        if (!collapsed && hideInSelection) {
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

      setActiveLine({ view, hideInSelection }: { view: EditorView; hideInSelection: boolean }) {
        const decorations = this.getDeco({ view, hideInSelection })

        this.decorations = decorations

        return decorations
      }

      removeActiveLine() {
        const decorations = Decoration.none

        this.decorations = decorations

        return decorations
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  )
}
