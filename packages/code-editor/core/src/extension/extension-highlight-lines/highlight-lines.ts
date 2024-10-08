import { invertedEffects } from '@codemirror/commands'
import { ChangeDesc, RangeSet, StateEffect, StateField } from '@codemirror/state'
import {
  Decoration,
  DecorationSet,
  EditorView,
  gutterLineClass,
  GutterMarker,
} from '@codemirror/view'

import { lineHighlightKeymap } from './commands'

interface LineEffectValue {
  from: number
}

type SerializedLineHighlightField = LineEffectValue[]
type SerializedLineGutterHighlightField = LineEffectValue[]

const isLineEffectValue = (
  effectValue: StateEffect<unknown>['value'],
): effectValue is LineEffectValue => {
  return true
}

export const HIGHLIGHT_LINE_CLASS = 'cm-highlight-line'
export const HIGHLIGHT_GUTTER_LINE_CLASS = 'cm-highlight-gutter'

const mark = {
  highlightLine: Decoration.line({
    class: HIGHLIGHT_LINE_CLASS,
  }),
  nonHighlightLine: Decoration.line({}),
}

const gutterMark = {
  highlightLine: new (class extends GutterMarker {
    elementClass = HIGHLIGHT_GUTTER_LINE_CLASS
  })(),
  nonHighlightLine: new (class extends GutterMarker {})(),
}

// state effect
export const addLineHighlight = StateEffect.define<LineEffectValue>({
  map: mapRange,
})

export const removeLineHighlight = StateEffect.define<LineEffectValue>({
  map: mapRange,
})

function mapRange(value: LineEffectValue, change: ChangeDesc) {
  return {
    from: change.mapPos(value.from),
  }
}

// state field
const lineHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(lines, tr) {
    let decoration = lines.map(tr.changes)

    for (const effect of tr.effects) {
      const targetEffectValue = effect.value

      if (effect.is(addLineHighlight) && isLineEffectValue(targetEffectValue)) {
        decoration = decoration.update({
          filter: () => false,
          filterFrom: targetEffectValue.from,
          filterTo: tr.state.doc.lineAt(targetEffectValue.from).to,
          add: [mark.highlightLine.range(targetEffectValue.from)],
        })
      } else if (effect.is(removeLineHighlight) && isLineEffectValue(targetEffectValue)) {
        decoration = decoration.update({
          filter: () => false,
          filterFrom: targetEffectValue.from,
          filterTo: tr.state.doc.lineAt(targetEffectValue.from).to,
          add: [mark.nonHighlightLine.range(targetEffectValue.from)],
        })
      }
    }

    return decoration
  },
  toJSON(decoration, state): SerializedLineHighlightField {
    const fromList: LineEffectValue[] = []

    decoration.between(0, state.doc.length, (from, to, decoration) => {
      if (decoration.spec.class === HIGHLIGHT_LINE_CLASS) {
        fromList.push({ from })
      }
    })

    return [...fromList]
  },
  fromJSON(json) {
    const ranges = (json as SerializedLineHighlightField).map(({ from }) =>
      mark.highlightLine.range(from),
    )

    return ranges.length ? RangeSet.of(ranges) : Decoration.none
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})

const lineGutterHighlightField = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty
  },
  update(markers, tr) {
    let decoration = markers.map(tr.changes)

    for (const effect of tr.effects) {
      const targetEffectValue = effect.value

      if (effect.is(addLineHighlight) && isLineEffectValue(targetEffectValue)) {
        decoration = decoration.update({
          filter: () => false,
          filterFrom: targetEffectValue.from,
          filterTo: tr.state.doc.lineAt(targetEffectValue.from).to,
          add: [gutterMark.highlightLine.range(targetEffectValue.from)],
        })
      } else if (effect.is(removeLineHighlight) && isLineEffectValue(targetEffectValue)) {
        decoration = decoration.update({
          filter: () => false,
          filterFrom: targetEffectValue.from,
          filterTo: tr.state.doc.lineAt(targetEffectValue.from).to,
          add: [gutterMark.nonHighlightLine.range(targetEffectValue.from)],
        })
      }
    }

    return decoration
  },
  toJSON(rangeSet, state): SerializedLineGutterHighlightField {
    const fromList: LineEffectValue[] = []

    rangeSet.between(0, state.doc.length, (from, to, rangeSet) => {
      if (rangeSet.elementClass === HIGHLIGHT_GUTTER_LINE_CLASS) {
        fromList.push({ from })
      }
    })

    return [...fromList]
  },
  fromJSON(json) {
    const ranges = (json as SerializedLineGutterHighlightField).map(({ from }) =>
      gutterMark.highlightLine.range(from),
    )

    return ranges.length ? RangeSet.of(ranges) : RangeSet.empty
  },
})

const highlightLineGutter = gutterLineClass.from(lineGutterHighlightField)

// inverted effect (undo, redo)
const invertedHighlight = invertedEffects.of((tr) => {
  const found = []

  for (const effect of tr.effects) {
    const targetEffectValue = effect.value

    if (effect.is(addLineHighlight) && isLineEffectValue(targetEffectValue)) {
      found.push(removeLineHighlight.of({ from: effect.value.from }))
    } else if (effect.is(removeLineHighlight) && isLineEffectValue(targetEffectValue)) {
      found.push(addLineHighlight.of({ from: effect.value.from }))
    }
  }

  return found
})

// theme
const lineHighlightTheme = EditorView.baseTheme({
  [`&:has(.${HIGHLIGHT_LINE_CLASS}) .cm-line:not(.${HIGHLIGHT_LINE_CLASS})`]: {
    opacity: '0.4',
  },
  [`&:has(.${HIGHLIGHT_LINE_CLASS}) .cm-line:not(.${HIGHLIGHT_LINE_CLASS}).cm-activeLine`]: {
    opacity: '1',
  },
  [`& .cm-line.${HIGHLIGHT_LINE_CLASS}`]: {
    opacity: '1',
  },
  [`.cm-gutters .cm-gutterElement.${HIGHLIGHT_GUTTER_LINE_CLASS}`]: {
    color: '#698FE5',
  },
  [`&:has(.cm-content[contenteditable="false"]) .cm-gutters .cm-activeLineGutter:not(.${HIGHLIGHT_GUTTER_LINE_CLASS})`]:
    {
      color: 'inherit',
    },
})

/**
 * linehighlight extension
 *
 * linehighlight가 적용된 경우,
 * 적용되지 않은 라인은 액티브 라인이 아닐 경우 불투명(`opacity: 0.4`)하게 보임
 *
 * @see {@link https://davidmyers.dev/blog/how-to-build-a-code-editor-with-codemirror-6-and-typescript/introduction#getting-the-most-out-of-the-codemirror-package}
 */
export const lineHighlight = () => {
  return [
    lineHighlightTheme,
    [lineHighlightField, lineGutterHighlightField],
    highlightLineGutter,
    invertedHighlight,
    lineHighlightKeymap,
  ]
}

export const lineHighlightFields = {
  lineHighlight: lineHighlightField,
  lineGutterHighlight: lineGutterHighlightField,
}
