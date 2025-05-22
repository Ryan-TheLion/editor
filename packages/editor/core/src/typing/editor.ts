import { DebouncedFunc } from 'lodash-es'
import { Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

export type InitialEditorContent = object | string

export interface DomElement extends HTMLElement {}

export type EditorChanged = {
  doc: boolean
  selection: boolean
}

export type EditorCompositionDebounce = DebouncedFunc<
  (view: EditorView, event: CompositionEvent) => void
>

export interface EditorUpdateCallback {
  (callbackData: { changed: EditorChanged; tr: Transaction }): void
}
