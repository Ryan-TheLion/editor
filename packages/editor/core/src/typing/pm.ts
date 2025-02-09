import { AttributeSpec, Attrs, Mark } from 'prosemirror-model'
import { Transaction } from 'prosemirror-state'
import { MarkViewConstructor, NodeViewConstructor } from 'prosemirror-view'

export type Dispatch = (tr: Transaction) => void

export interface TypedAttributeSpec<T> extends AttributeSpec {
  default?: T
}

export type TypedAttributeSpecs<Attrs extends Record<any, any>> = {
  [key in keyof Attrs]: TypedAttributeSpec<Attrs[key]>
}

export type TypedWidgetSpec<T extends Record<string, any>> = {
  side?: number
  marks?: readonly Mark[]
  stopEvent?: (event: Event) => boolean
  ignoreSelection?: boolean
  key?: string
  destroy?: (node: Node) => void
} & T

export type ReturnAttrs = Attrs | false | null

export type DOMOutputArraySpec = [string, ...any[]]

export type ViewMutationRecord = MutationRecord | { type: 'selection'; target: HTMLElement }

/* ---- nodeView ---- */

export type NodeViewConstructorParams = {
  node: Parameters<NodeViewConstructor>[0]
  view: Parameters<NodeViewConstructor>[1]
  getPos: Parameters<NodeViewConstructor>[2]
  decorations: Parameters<NodeViewConstructor>[3]
  innerDecorations: Parameters<NodeViewConstructor>[4]
}

/* ---- markView ---- */

export type MarkViewConstructorParams = {
  mark: Parameters<MarkViewConstructor>[0]
  view: Parameters<MarkViewConstructor>[1]
  inline: Parameters<MarkViewConstructor>[2]
}

export interface MarkView {
  dom: HTMLElement
  contentDOM?: HTMLElement
  ignoreMutation?: (mutation: ViewMutationRecord) => boolean
  destroy?: () => void
}
