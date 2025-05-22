import { Attrs, Mark, MarkType } from 'prosemirror-model'
import { Command, EditorState, TextSelection } from 'prosemirror-state'

interface UnsetMarkOptions {
  removeTargetWhenEmpty?: 'storedMark' | 'node'
  removeTarget?: 'selectionFromTo' | 'node'
}

export function setMark(
  {
    markType,
    attrs,
    text,
  }: {
    markType: MarkType
    attrs?: Attrs
    text?: string
  },
  removeMarkTypeAfterSet?: (mark: Mark) => boolean,
): Command {
  return (state, dispatch, view) => {
    if (view && !view.editable) return false

    if (!canSetMark({ state, markType })) return false

    const { $from, $to, empty } = state.selection

    const tr = state.tr
    let changed = false

    if (empty) {
      const currentMarks = state.storedMarks ?? $from.marks()
      const sameTypeMark = markType.isInSet(currentMarks)
      const mark = markType.create({
        ...sameTypeMark?.attrs,
        ...attrs,
      })

      if (text) {
        tr.insert(
          $from.pos,
          state.schema.text(text, [...(state.storedMarks ?? []), ...$from.marks(), mark]),
        )

        changed = true
      } else {
        if (sameTypeMark && !sameTypeMark.eq(mark)) {
          tr.removeStoredMark(markType).addStoredMark(
            markType.create({
              ...sameTypeMark.attrs,
              ...attrs,
            }),
          )

          changed = true
        }

        if (!sameTypeMark) {
          tr.addStoredMark(mark)

          changed = true
        }
      }
    } else {
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.isInline) {
          const sameTypeMark = markType.isInSet(node.marks)
          const mark = markType.create({
            ...sameTypeMark?.attrs,
            ...attrs,
          })

          const resolvedPos = state.doc.resolve(pos)

          const from = Math.max(pos, $from.pos)
          const to = Math.min(resolvedPos.end(), $to.pos)

          if (!sameTypeMark || !sameTypeMark.eq(mark)) {
            tr.addMark(from, to, mark)

            changed = true

            return
          }
        }
      })
    }

    if (changed && removeMarkTypeAfterSet) {
      const { $from, $to } = tr.selection

      if (empty) {
        const currentMarks = tr.storedMarks ?? $from.marks()

        currentMarks.forEach((currentMark) => {
          removeMarkTypeAfterSet(currentMark) && tr.removeStoredMark(markType)
        })
      } else {
        tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (node.marks) {
            node.marks.forEach((nodeMark) => {
              if (removeMarkTypeAfterSet(nodeMark)) {
                const resolvedPos = tr.doc.resolve(pos)

                const from = Math.max(pos, $from.pos)
                const to = Math.min(resolvedPos.end(), $to.pos)

                tr.removeMark(from, to, markType)
              }
            })
          }
        })
      }
    }

    if (!changed) return false

    if (dispatch) {
      dispatch(tr)
    }

    return true
  }
}

export function unsetMark(
  markType: MarkType,
  { removeTarget = 'selectionFromTo', removeTargetWhenEmpty = 'storedMark' }: UnsetMarkOptions = {},
): Command {
  return (state, dispatch, view) => {
    if (view && !view.editable) return false

    const { $from, $to, $anchor, $head, empty } = state.selection

    const tr = state.tr

    if (empty) {
      const sameTypeMark = markType.isInSet(state.storedMarks ?? $from.marks())

      if (!sameTypeMark) return false

      if (dispatch) {
        removeTargetWhenEmpty === 'storedMark'
          ? dispatch(tr.removeStoredMark(markType))
          : dispatch(tr.removeMark($from.start(), $from.end(), markType))
      }

      return true
    }

    if (!state.doc.rangeHasMark($from.pos, $to.pos, markType)) return false

    if (dispatch) {
      const anchor = $anchor.pos > $head.pos ? $head : $anchor
      const head = $anchor.pos > $head.pos ? $anchor : $head

      const targetSelection = {
        from: removeTarget === 'selectionFromTo' ? $from.pos : anchor.start(),
        to: removeTarget === 'selectionFromTo' ? $to.pos : head.end(),
      }

      dispatch(tr.removeMark(targetSelection.from, targetSelection.to, markType))
    }

    return true
  }
}

export const canSetMark = ({ state, markType }: { state: EditorState; markType: MarkType }) => {
  const { selection } = state

  if (selection instanceof TextSelection && selection.$cursor) {
    const currentMarks = state.storedMarks ?? selection.$cursor.marks()

    return (
      !!markType.isInSet(currentMarks) || !currentMarks.some((mark) => mark.type.excludes(markType))
    )
  }

  return selection.ranges.some(({ $from, $to }) => {
    let allowsMarkType =
      $from.depth === 0 ? state.doc.inlineContent && state.doc.type.allowsMarkType(markType) : false

    state.doc.nodesBetween($from.pos, $to.pos, (node, pos, parent) => {
      if (allowsMarkType) {
        return false
      }

      if (node.isInline) {
        const parentAllowsMarkType = !parent || parent.type.allowsMarkType(markType)

        const nodeAllowsMarkType =
          !!markType.isInSet(node.marks) || !node.marks.some((mark) => mark.type.excludes(markType))

        allowsMarkType = parentAllowsMarkType && nodeAllowsMarkType
      }

      return !allowsMarkType
    })

    return allowsMarkType
  })
}

export const getMarkAttrs = <Attributes extends Attrs = Attrs>(mark: Mark) => {
  return mark.attrs as Attributes
}
