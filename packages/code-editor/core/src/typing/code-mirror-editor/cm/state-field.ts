import { EditorState, Extension, StateField, Transaction } from '@codemirror/state'

export type StateFieldSpec<Value> = {
  /**
    Creates the initial value for the field when a state is created.
    */
  create: (state: EditorState) => Value
  /**
    Compute a new value from the field's previous value and a
    [transaction](https://codemirror.net/6/docs/ref/#state.Transaction).
    */
  update: (value: Value, transaction: Transaction) => Value
  /**
    Compare two values of the field, returning `true` when they are
    the same. This is used to avoid recomputing facets that depend
    on the field when its value did not change. Defaults to using
    `===`.
    */
  compare?: (a: Value, b: Value) => boolean
  /**
    Provide extensions based on this field. The given function will
    be called once with the initialized field. It will usually want
    to call some facet's [`from`](https://codemirror.net/6/docs/ref/#state.Facet.from) method to
    create facet inputs from this field, but can also return other
    extensions that should be enabled when the field is present in a
    configuration.
    */
  provide?: (field: StateField<Value>) => Extension
  /**
    A function used to serialize this field's content to JSON. Only
    necessary when this field is included in the argument to
    [`EditorState.toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON).
    */
  toJSON?: (value: Value, state: EditorState) => any
  /**
    A function that deserializes the JSON representation of this
    field's content.
    */
  fromJSON?: (json: any, state: EditorState) => Value
}

export interface StateFields {
  [prop: string]: StateField<any>
}
