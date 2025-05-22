import { RangeSet } from '@codemirror/state'
import { EditorView, gutterLineClass, GutterMarker } from '@codemirror/view'

import { editorHasFocus } from '../editor'

export const viewActiveLineGutter = () => {
  return activeLineGutter()
}

const activeLineGutter = () => {
  const activeLineGutterMarker = new (class extends GutterMarker {
    elementClass = 'cm-activeLineGutter'
  })()

  return gutterLineClass.compute([editorHasFocus.reader, 'selection'], (state) => {
    const editable = state.facet(EditorView.editable.reader)
    const focused = state.facet(editorHasFocus.reader)

    if (!editable) return RangeSet.of([])
    if (!focused) return RangeSet.of([])

    let marks = []
    let last = -1

    for (const range of state.selection.ranges) {
      const linePos = state.doc.lineAt(range.head).from

      if (linePos > last) {
        last = linePos
        marks.push(activeLineGutterMarker.range(linePos))
      }
    }

    return RangeSet.of(marks)
  })
}
