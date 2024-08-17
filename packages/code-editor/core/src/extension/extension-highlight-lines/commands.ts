import { Line } from '@codemirror/state'
import { Command, EditorView, keymap } from '@codemirror/view'

import {
  addLineHighlight,
  HIGHLIGHT_LINE_CLASS,
  lineHighlightFields,
  removeLineHighlight,
} from './highlight-lines'

export const activeLineHighlight: Command = (view) => {
  const { from } = view.state.selection.main

  const targetLine = view.state.doc.lineAt(from)
  if (lineIsHighlighted({ view, line: targetLine })) return true

  view.dispatch({
    effects: addLineHighlight.of({ from: targetLine.from }),
  })

  return true
}

export const unActiveLineHighlight: Command = (view) => {
  const { from } = view.state.selection.main

  const targetLine = view.state.doc.lineAt(from)
  if (!lineIsHighlighted({ view, line: targetLine })) return true

  view.dispatch({ effects: removeLineHighlight.of({ from: targetLine.from }) })

  return true
}

export const toggleLineHighlight: Command = (view) => {
  const { from } = view.state.selection.main

  const targetLine = view.state.doc.lineAt(from)

  const isHighlighted = lineIsHighlighted({ view, line: targetLine })

  return isHighlighted ? unActiveLineHighlight(view) : activeLineHighlight(view)
}

function lineIsHighlighted({ view, line }: { view: EditorView; line: Line }) {
  let isHighlighted = false

  view.state
    .field(lineHighlightFields.lineHighlight)
    .between(line.from, line.to, (from, to, value) => {
      if (value.spec.class === HIGHLIGHT_LINE_CLASS) {
        isHighlighted = true

        return false
      }
    })

  return isHighlighted
}

export const lineHighlightKeymap = keymap.of([
  {
    key: 'Mod-h',
    run: toggleLineHighlight,
  },
  {
    key: 'Mod-Shift-h',
    run: unActiveLineHighlight,
  },
])
