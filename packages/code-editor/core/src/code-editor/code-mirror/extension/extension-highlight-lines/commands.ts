import { Line } from '@codemirror/state'
import { Command, EditorView, keymap } from '@codemirror/view'

import { addLineHighlight, lineHighlightFields, removeLineHighlight } from './highlight-lines'
import { HIGHLIGHT_LINE_CLASS } from './theme'

export const activeLineHighlight: (lineNumbers?: number[]) => Command = (lineNumbers) => {
  return (view) => {
    if (!lineNumbers?.length) {
      const selectedLines = getSelectedLines(view)

      if (!selectedLines.length) return true

      const effects = selectedLines
        .filter((line) => !lineIsHighlighted({ view, line }))
        .map((line) => addLineHighlight.of({ from: line.from }))

      if (!effects.length) return true

      view.dispatch({
        effects,
      })

      return true
    }

    const activeTargetLines = lineNumbers
      .filter((lineNumber) => {
        return !lineIsHighlighted({ view, line: view.state.doc.line(lineNumber) })
      })
      .map((lineNumber) => view.state.doc.line(lineNumber))

    if (!activeTargetLines.length) return true

    const effects = activeTargetLines.map((line) => {
      return addLineHighlight.of({ from: line.from })
    })

    view.dispatch({
      effects,
    })

    return true
  }
}

export const unActiveLineHighlight: (lineNumbers?: number[]) => Command = (lineNumbers) => {
  return (view) => {
    if (!lineNumbers?.length) {
      const selectedLines = getSelectedLines(view)

      if (!selectedLines.length) return true

      const effects = selectedLines
        .filter((line) => lineIsHighlighted({ view, line }))
        .map((line) => removeLineHighlight.of({ from: line.from }))

      if (!effects.length) return true

      view.dispatch({
        effects,
      })

      return true
    }

    const unactiveTargetLines = lineNumbers
      .filter((lineNumber) => {
        return lineIsHighlighted({ view, line: view.state.doc.line(lineNumber) })
      })
      .map((lineNumber) => view.state.doc.line(lineNumber))

    if (!unactiveTargetLines.length) return true

    const effects = unactiveTargetLines.map((line) => {
      return removeLineHighlight.of({ from: line.from })
    })

    view.dispatch({
      effects,
    })

    return true
  }
}

export const toggleLineHighlight: Command = (view) => {
  const selectedLines = getSelectedLines(view)

  const effects = selectedLines.map((line) => {
    return lineIsHighlighted({ view, line })
      ? removeLineHighlight.of({ from: line.from })
      : addLineHighlight.of({ from: line.from })
  })

  view.dispatch({
    effects,
  })

  return true
}

// keymap

export const lineHighlightKeymap = keymap.of([
  {
    key: 'Mod-h',
    run: toggleLineHighlight,
  },
  {
    key: 'Mod-Shift-h',
    run: activeLineHighlight(),
  },
  {
    key: 'Mod-Alt-h',
    run: unActiveLineHighlight(),
  },
])

// util

function getSelectedLines(view: EditorView) {
  const lineNumberSet = new Set<number>()
  const lines: Line[] = []

  for (const range of view.state.selection.ranges) {
    const { from, to } = range

    const fromLine = view.state.doc.lineAt(from)
    const toLine = view.state.doc.lineAt(to)

    const length = toLine.number - fromLine.number + 1

    Array.from({ length }).forEach((_, index) => {
      const lineNumber = fromLine.number + index

      if (lineNumberSet.has(lineNumber)) return

      lineNumberSet.add(lineNumber)

      lines.push(view.state.doc.line(lineNumber))
    })
  }

  return lines
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
