import { Attrs, Fragment, Node, NodeType, ResolvedPos, Slice } from 'prosemirror-model'
import { Command, EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state'

import { PARAGRAPH_NAME } from '../../prose-mirror/extensions/paragraph'
import { imageAspectRatio } from './image'
import { isNodeSelection } from './selection'

export const maybeEmptyNode = (node: Node): boolean => {
  if (node.isTextblock && !node.childCount) return true

  return (
    node.childCount === 1 && node.firstChild!.isTextblock && node.firstChild!.content.size === 0
  )
}

export const findPositionedAncestor = (dom: globalThis.Node) => {
  let parent = dom.parentElement

  while (parent) {
    const computedPosition = getComputedStyle(parent).position

    if (
      computedPosition === 'relative' ||
      computedPosition === 'absolute' ||
      computedPosition === 'fixed'
    ) {
      break
    }

    parent = parent.parentElement
  }

  return parent ?? document.body
}

/**
 * next line 노드가 없을 경우 true
 *
 * (ex.) Enter 등의 변화가 생길 때 next line 노드가 없을 경우 새로운 라인을 삽입하는 로직에 활용
 */
export const needsNewLine = ({ state }: { state: EditorState }) => {
  return nextLineNode({ state }) === null
}

/** 이전 line 노드 반환 */
export const prevLineNode = ({ state }: { state: EditorState }) => {
  const { $from } = state.selection

  const beforePos = $from.before(1)
  const $before = state.doc.resolve(beforePos)

  return $before.nodeBefore
}

/**
 * 다음 라인 노드를 반환
 */
export const nextLineNode = ({ state }: { state: EditorState }) => {
  const { $to } = state.selection

  const afterPos = $to.after(1)
  const $after = state.doc.resolve(afterPos)

  return $after.nodeAfter
}

export const insertNewLineAtPrevBlock = ({
  state,
  tr,
  focusLine,
}: {
  state: EditorState
  tr?: Transaction
  focusLine?: boolean
}) => {
  const transaction = tr ?? state.tr

  const paragraphNodeType = state.schema.nodes[PARAGRAPH_NAME]

  if (!paragraphNodeType) return transaction

  const { $from } = state.selection
  const insertPos = $from.before(1)

  transaction.insert(insertPos, paragraphNodeType.create())

  if (!focusLine) return transaction

  const expectedPos = transaction.selection.$from.before(1) - 1

  transaction.setSelection(TextSelection.near(transaction.doc.resolve(Math.max(expectedPos, 0))))

  return transaction
}

export const insertNewLineAtNextBlock = ({
  state,
  tr,
  focusLine,
}: {
  state: EditorState
  tr?: Transaction
  focusLine?: boolean
}) => {
  const transaction = tr ?? state.tr

  const paragraphNodeType = state.schema.nodes[PARAGRAPH_NAME]

  if (!paragraphNodeType) return transaction

  const { $to } = state.selection
  const insertPos = $to.after(1)

  transaction.insert(insertPos, paragraphNodeType.create())

  if (!focusLine) return transaction

  const expectedPos = transaction.selection.$to.after(1) + 1

  transaction.setSelection(
    TextSelection.near(
      transaction.doc.resolve(Math.min(expectedPos, transaction.doc.content.size)),
    ),
  )

  return transaction
}

export const getNodePos = ({ node, doc }: { node: Node; doc: Node }) => {
  let nodePos: number | undefined

  doc.descendants((childNode, pos, parent, index) => {
    if (typeof nodePos === 'number') return false

    if (childNode.eq(node)) {
      nodePos = pos
    }
  })

  return typeof nodePos === 'number' ? nodePos : null
}

export const getNodeAttrs = <Attributes extends Attrs = Attrs>(node: Node) => {
  return node.attrs as Attributes
}

export const setNodeAttributes = <Attributes extends Attrs = Attrs>(
  node: Node,
  attrs: Attributes,
  { tr }: { tr: Transaction },
) => {
  if (!Object.keys(node.attrs).length) return false

  const pos = getNodePos({ node, doc: tr.doc })

  if (typeof pos !== 'number') return false

  for (const [key, value] of Array.from(Object.entries(attrs))) {
    if (key in node.attrs) {
      tr.setNodeAttribute(pos, key, value)
    }
  }

  return tr.docChanged
}

export const updateNodeAttributes = <Attributes extends Attrs = Attrs>(
  node: Node,
  attrs: Attributes,
  { tr }: { tr: Transaction },
) => {
  if (!Object.keys(node.attrs).length) return false

  const pos = getNodePos({ node, doc: tr.doc })

  if (typeof pos !== 'number') return false

  for (const [key, value] of Array.from(Object.entries(attrs))) {
    if (key in node.attrs && node.attrs[key] !== attrs[key]) {
      tr.setNodeAttribute(pos, key, value)
    }
  }

  return {
    tr,
    changed: tr.docChanged,
  }
}

export const matchParent = ($pos: ResolvedPos, predicate: (node: Node) => boolean) => {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const parent = $pos.node(depth)

    if (predicate(parent)) {
      return {
        node: parent,
        pos: $pos.before(depth),
      }
    }
  }

  return null
}

export const deleteSelectedNode: (nodeType: NodeType) => Command = (nodeType) => {
  return (state, dispatch, view) => {
    if (!isNodeSelection(state.selection)) return false

    const { node, $from } = state.selection

    if (node.type.name !== nodeType.name) return false

    const depth = $from.depth

    const from = depth === 0 ? $from.pos : $from.before()
    const to = depth === 0 ? from + node.nodeSize : $from.after()

    if (dispatch) {
      const tr = state.tr
      tr.delete(from, to)

      dispatch(tr)
    }

    return true
  }
}

export const getOpenDepths = (fragment: Fragment) => {
  let openStart = 0
  let openEnd = 0

  let currentStartNode = fragment.firstChild
  let currentEndNode = fragment.lastChild

  while (currentStartNode && currentStartNode.isLeaf === false) {
    openStart++
    currentStartNode = currentStartNode.firstChild
  }

  while (currentEndNode && currentEndNode.isLeaf === false) {
    openEnd++
    currentEndNode = currentEndNode.firstChild
  }

  return {
    openStart,
    openEnd,
  }
}

export const convertFragmentToSlice = (
  fragment: Fragment,
  { from, to }: { from?: number; to?: number } = {},
) => {
  let targetFragment = fragment.cut(from ?? 0, to)

  const { openStart, openEnd } = getOpenDepths(targetFragment)

  return new Slice(targetFragment, openStart, openEnd)
}

export const isSelectedNode = ({
  nodeOrType,
  selection,
}: {
  nodeOrType: Node | NodeType
  selection: Selection
}) => {
  if (!isNodeSelection(selection)) return false

  const { node: selectedNode } = selection

  return nodeOrType instanceof NodeType
    ? selectedNode.type.name === nodeOrType.name
    : selectedNode.eq(nodeOrType)
}

export const createSkeletonPlaceholder = ({
  skeletonClassNames = ['skeleton'],
  width,
  height,
}: {
  skeletonClassNames?: string[]
  width: number
  height: number
}) => {
  const placeholder = document.createElement('div')

  skeletonClassNames.forEach((cls) => {
    placeholder.classList.add(cls)
  })

  const ratio = imageAspectRatio({ width, height })

  placeholder.style.width = `${width}px`

  if (ratio) {
    placeholder.style.maxWidth = '100%'
    placeholder.style.aspectRatio = ratio
  } else {
    placeholder.style.height = `${height}px`
  }

  return placeholder
}

// -----------------------

export const fragmentChildren = (fragment: Fragment) => {
  const children: Node[] = []

  for (let i = 0; i < fragment.childCount; i++) {
    children.push(fragment.child(i))
  }

  return children
}
