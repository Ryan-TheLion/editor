import { isEqual } from 'lodash-es'
import { Attrs, Fragment, Mark, MarkType, Node, NodeType } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'

export const selectionHasMark: {
  ({ state, type }: { state: EditorState; type: Mark }): boolean
  ({ state, type, attrs }: { state: EditorState; type: MarkType; attrs?: Attrs }): boolean
} = ({
  state,
  type,
  attrs,
}: {
  state: EditorState
  type: Mark | MarkType
  attrs?: Attrs
}): boolean => {
  const { $from, $to, empty } = state.selection

  const marks = state.storedMarks ?? $from.marks()

  const from = $from.pos
  const to = $to.pos

  if (type instanceof Mark) {
    return empty ? type.isInSet(marks) : state.doc.rangeHasMark(from, to, type)
  }

  const hasAttrs = !!attrs && !!Object.keys(attrs).length

  const markOrMarkType = hasAttrs ? type.create(attrs) : type

  return empty ? !!markOrMarkType.isInSet(marks) : state.doc.rangeHasMark(from, to, markOrMarkType)
}

export const hasAttrInSelectionMarks = ({
  state,
  key,
  value,
}: {
  state: EditorState
  key: string
  value?: any
}) => {
  const { $from, $to, empty } = state.selection

  if (empty) {
    const marks = state.storedMarks ?? $from.marks()

    if (value === undefined) {
      return marks.some((mark) => key in mark.attrs)
    }

    return matchMarkAttrs(
      marks as Mark[],
      {
        [key]: value,
      },
      { matchTarget: 'attrs' },
    )
  }

  const from = $from.pos
  const to = $to.pos

  let found = false

  state.doc.nodesBetween(from, to, (node) => {
    if (found) return false

    if (node.marks?.length) {
      if (value === undefined && node.marks.some((mark) => key in mark.attrs)) {
        found = true
        return false
      }

      if (
        value !== undefined &&
        matchMarkAttrs(node.marks as Mark[], { [key]: value }, { matchTarget: 'attrs' })
      ) {
        found = true
        return false
      }
    }
  })

  return found
}

export const matchMarkAttrs = (
  marks: Mark[],
  attrs: Attrs,
  { matchTarget = 'markAttrs' }: { matchTarget?: 'markAttrs' | 'attrs' } = {},
) => {
  if (attrs && !Object.keys(attrs).length) return false

  if (matchTarget === 'markAttrs') {
    return marks.some((mark) => {
      return isEqual(mark.attrs, attrs)
    })
  }

  return Array.from(Object.entries(attrs)).every(([key, value]) => {
    return marks.some((mark) => {
      const markAttrs = mark.attrs
      const hasKey = key in markAttrs

      if (!hasKey) return false

      return isEqual(markAttrs[key], value)
    })
  })
}

export const selectionHasNodeType = ({
  state,
  nodeType,
  attrs,
  exactMatchAttrs = true,
}: {
  state: EditorState
  nodeType: NodeType
  attrs?: Attrs
  exactMatchAttrs?: boolean
}) => {
  let hasNodeType = false

  const { $from, $to } = state.selection

  state.doc.nodesBetween($from.pos, $to.pos, (node) => {
    if (hasNodeType) return false

    if (node.type === nodeType) {
      if (!attrs || !Object.keys(attrs).length) {
        hasNodeType = true

        return false
      }

      hasNodeType = (({ node }: { node: Node; attrs: Attrs; exactMatchAttrs?: boolean }) => {
        if (exactMatchAttrs) {
          return isEqual(node.attrs, attrs)
        }

        return Array.from(Object.entries(attrs)).every(([key, value]) => {
          const hasKey = key in node.attrs

          if (!hasKey) return false

          return isEqual(node.attrs[key], value)
        })
      })({
        node,
        attrs,
        exactMatchAttrs,
      })
    }
  })

  return hasNodeType
}

export const fragmentHasType = (fragment: Fragment, typeNames: string[]) => {
  let hasType = false

  fragment.descendants((node) => {
    if (hasType) return false

    if (typeNames.includes(node.type.name)) {
      hasType = true

      return false
    }
  })

  return hasType
}

export const hasAttr = (attrs: Attrs, key: string) => {
  return key in attrs
}
