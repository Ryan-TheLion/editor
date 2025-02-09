import { Node, ResolvedPos } from 'prosemirror-model'
import { EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state'

interface SummarizeResolved {
  pos: number
  node: Node
  parentNode: Node
  parentStart: number
  parentEnd: number
}

export type SummarizeSelectionAddCase = (args: {
  resolvedPos: { $from: ResolvedPos; $to: ResolvedPos }
  summerizedSelection: SummarizedSelection
}) => Record<any, any>

export type SummarizedSelection<E extends Record<any, any> = {}> = {
  from: SummarizeResolved
  to: SummarizeResolved
  blockStart: number
  blockEnd: number
  sameParent: boolean
  empty: boolean
  atStart: boolean
  atEnd: boolean
} & E

export function summarizeSelection(selection: Selection): SummarizedSelection
export function summarizeSelection<AddCase extends SummarizeSelectionAddCase>(
  selection: Selection,
  addCase: AddCase,
): SummarizedSelection<ReturnType<AddCase>>
export function summarizeSelection(selection: Selection, addCase?: SummarizeSelectionAddCase) {
  const { $from, $to, empty } = selection

  const summerizedSelection: SummarizedSelection = {
    from: {
      pos: $from.pos,
      node: $from.index() - 1 < 0 ? $from.node() : $from.parent.content.child($from.index() - 1),
      parentNode: $from.parent,
      parentStart: $from.start(),
      parentEnd: $from.end(),
    },
    to: {
      pos: $to.pos,
      node: $to.index() - 1 < 0 ? $to.node() : $to.parent.content.child($to.index() - 1),
      parentNode: $to.parent,
      parentStart: $to.start(),
      parentEnd: $to.end(),
    },
    blockStart: $from.start(),
    blockEnd: empty ? $from.end() : $to.end(),
    sameParent: $from.sameParent($to),
    empty,
    atStart: $from.parentOffset === 0,
    atEnd: $to.parentOffset === $to.parent.content.size,
  }

  const addCaseResult = addCase?.({ resolvedPos: { $from, $to }, summerizedSelection })

  return {
    ...summerizedSelection,
    ...(addCaseResult && addCaseResult),
  }
}

export const isAllSelected = (state: EditorState) => {
  const $doc = {
    $anchor: Selection.atStart(state.doc).$anchor,
    $head: Selection.atEnd(state.doc).$head,
  }

  const $state = {
    $anchor: state.selection.$anchor,
    $head: state.selection.$head,
  }

  return $doc.$anchor.pos === $state.$anchor.pos && $doc.$head.pos === $state.$head.pos
}

export const isTextSelection = (selection: Selection) => {
  return selection instanceof TextSelection
}

export const isNodeSelection = (selection: Selection) => {
  return selection instanceof NodeSelection
}
