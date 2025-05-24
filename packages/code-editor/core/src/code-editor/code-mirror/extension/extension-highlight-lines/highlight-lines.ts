import { invertedEffects } from '@codemirror/commands'
import {
  EditorState,
  Extension,
  Line,
  RangeSet,
  StateEffect,
  StateField,
  Transaction,
} from '@codemirror/state'
import {
  Decoration,
  DecorationSet,
  EditorView,
  gutterLineClass,
  GutterMarker,
} from '@codemirror/view'

import { isEqual } from '../../../../utils'
import { lineHighlightKeymap } from './commands'
import { HIGHLIGHT_GUTTER_LINE_CLASS, HIGHLIGHT_LINE_CLASS, lineHighlightTheme } from './theme'

interface LineEffectValue {
  from: number
}

type SerializedLineHighlightField = LineEffectValue[]
type SerializedLineGutterHighlightField = LineEffectValue[]

const mark = {
  highlightLine: Decoration.line({
    class: HIGHLIGHT_LINE_CLASS,
  }),
  highlightLineGutter: new (class extends GutterMarker {
    elementClass = HIGHLIGHT_GUTTER_LINE_CLASS
  })(),
}

// state effect
export const addLineHighlight = StateEffect.define<LineEffectValue>()

export const removeLineHighlight = StateEffect.define<LineEffectValue>()

// state field
const lineHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorationSet, tr) {
    let decoration = decorationSet.map(tr.changes)

    const effects = getLinehighlightEffects(tr)

    if (!effects.add.length && !effects.remove.length) return decoration

    for (const removeEffect of effects.remove) {
      decoration = decoration.update({
        filter: (from) => removeEffect.value.from !== from,
      })
    }

    for (const addEffect of effects.add) {
      decoration = decoration.update({
        filter: (from) => from !== addEffect.value.from,
        add: [mark.highlightLine.range(addEffect.value.from)],
      })
    }

    return decoration
  },
  toJSON(decoration): SerializedLineHighlightField {
    return rangeSetArray(decoration).map((range) => ({ from: range.from }))
  },
  fromJSON(json) {
    const ranges = (json as SerializedLineHighlightField).map(({ from }) =>
      mark.highlightLine.range(from),
    )

    return ranges.length ? RangeSet.of(ranges) : Decoration.none
  },
  compare(a, b) {
    const rangeA = rangeSetArray(a).map((range) => ({
      from: range.from,
      to: range.to,
    }))

    const rangeB = rangeSetArray(b).map((range) => ({
      from: range.from,
      to: range.to,
    }))

    return isEqual(rangeA, rangeB)
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})

const lineGutterHighlightField = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty
  },
  update(gutterMarkerSet, tr) {
    let decoration = gutterMarkerSet.map(tr.changes)

    const effects = getLinehighlightEffects(tr)
    if (!effects.add.length && !effects.remove.length) return decoration

    for (const removeEffect of effects.remove) {
      decoration = decoration.update({
        filter: (from) => removeEffect.value.from !== from,
      })
    }

    for (const addEffect of effects.add) {
      decoration = decoration.update({
        filter: (from) => from !== addEffect.value.from,
        add: [mark.highlightLineGutter.range(addEffect.value.from)],
      })
    }

    return decoration
  },
  toJSON(rangeSet): SerializedLineGutterHighlightField {
    return rangeSetArray(rangeSet).map((range) => ({ from: range.from }))
  },
  fromJSON(json) {
    const ranges = (json as SerializedLineGutterHighlightField).map(({ from }) =>
      mark.highlightLineGutter.range(from),
    )

    return ranges.length ? RangeSet.of(ranges) : RangeSet.empty
  },
  compare(a, b) {
    const rangeA = rangeSetArray(a).map((range) => ({
      from: range.from,
      to: range.to,
    }))

    const rangeB = rangeSetArray(b).map((range) => ({
      from: range.from,
      to: range.to,
    }))

    return isEqual(rangeA, rangeB)
  },
  provide(field) {
    return gutterLineClass.from(field)
  },
})

// inverted effect (undo, redo)
const invertedHighlight = invertedEffects.of((tr) => {
  const found: StateEffect<LineEffectValue>[] = []

  for (const effect of tr.effects) {
    if (effect.is(addLineHighlight)) {
      found.push(removeLineHighlight.of({ from: effect.value.from }))

      continue
    }

    if (effect.is(removeLineHighlight)) {
      found.push(addLineHighlight.of({ from: effect.value.from }))

      continue
    }
  }

  return found
})

const updateEffects = EditorState.transactionExtender.of((tr) => {
  const userEvent = tr.annotation(Transaction.userEvent)

  if (userEvent?.startsWith('delete')) {
    const removedlinehighlightField = getRemovedlinehighlightField(tr)

    if (removedlinehighlightField.length) {
      const remove: StateEffect<LineEffectValue>[] = []

      removedlinehighlightField.forEach((highlight) => {
        remove.push(removeLineHighlight.of({ from: highlight.from }))
      })

      return {
        effects: remove,
      }
    }

    return {}
  }

  return {}
})

// linehighlight를 가지고 있는지에 대한 dataset 설정 (스타일링에 활용)
const setHasLineHighlight = EditorView.editorAttributes.compute([lineHighlightField], (state) => {
  return {
    'data-has-line-highlight': state.field(lineHighlightField).size ? 'true' : 'false',
  }
})

/**
 * linehighlight extension
 *
 * - linehighlight가 적용된 경우,
 *   적용되지 않은 라인은 액티브 라인이 아닐 경우 불투명(`opacity: 0.4`)하게 보임
 * @see {@link https://davidmyers.dev/blog/how-to-build-a-code-editor-with-codemirror-6-and-typescript/introduction#getting-the-most-out-of-the-codemirror-package}
 *
 * - 옵션을 설정(`opt.themeExtension`)해서 커스텀 테마 extension으로 대체할 수 있음
 *   - `lineHighlightStyleSelector` 메소드 활용 가능
 */
export const lineHighlight = (opt?: { themeExtension: Extension }) => {
  return [
    opt?.themeExtension ?? lineHighlightTheme(),
    [lineHighlightField, lineGutterHighlightField],
    invertedHighlight,
    updateEffects,
    setHasLineHighlight,
    lineHighlightKeymap,
  ]
}

export const lineHighlightFields = {
  lineHighlight: lineHighlightField,
  lineGutterHighlight: lineGutterHighlightField,
}

// util

function getLinehighlightEffects(tr: Transaction) {
  const effects: Record<'add' | 'remove', StateEffect<LineEffectValue>[]> = {
    add: [],
    remove: [],
  }

  tr.effects.forEach((effect) => {
    if (effect.is(addLineHighlight)) {
      effects.add.push(effect)

      return
    }

    if (effect.is(removeLineHighlight)) {
      effects.remove.push(effect)

      return
    }
  })

  return {
    ...effects,
    empty: !effects.add.length && !effects.remove.length,
  }
}

function getRemovedlinehighlightField(tr: Transaction) {
  const prevLinehighlight = stateFieldRangeSetMap({
    tr,
    stateType: 'startState',
    field: lineHighlightField,
  })
  const currentLinehighlight = stateFieldRangeSetMap({
    tr,
    stateType: 'state',
    field: lineHighlightField,
  })

  const removedLinehighlight: Line[] = []

  prevLinehighlight.forEach((prev) => {
    if (currentLinehighlight.some((current) => current.line.number === prev.line.number)) return

    removedLinehighlight.push(prev.line)
  })

  return removedLinehighlight
}

function rangeSetArray<R extends RangeSet<any>>(rangeSet: R) {
  const values: { from: number; to: number; value: R extends RangeSet<infer T> ? T : never }[] = []

  let iter = rangeSet.iter(0)

  while (iter.value) {
    values.push({ from: iter.from, to: iter.to, value: iter.value })

    iter.next()
  }

  return values
}

function stateFieldRangeSetMap<
  Field extends StateField<RangeSet<any>>,
  Value extends Field extends StateField<RangeSet<infer V>> ? RangeSet<V> : never,
>(
  {
    tr,
    stateType,
    field,
  }: {
    tr: Transaction
    stateType: 'startState' | 'state'
    field: Field
  },
  changesMap?: boolean,
) {
  const targetState = tr[stateType]
  const targetField = targetState.field(field)

  const targetRangeSet = changesMap ? targetField.map(tr.changes) : targetField

  return rangeSetArray<Value>(targetRangeSet as any).map((rangeSet) => {
    return {
      ...rangeSet,
      line: targetState.doc.lineAt(rangeSet.from),
    }
  })
}
