import { EditorView, ViewPlugin } from '@codemirror/view'
import {
  CSS_VARS_DEFAULT_STORAGE_KEY,
  CssVarFields,
  CssVarKeys,
  CssVarManager,
  CssVarValue,
  CssVarViewPlugin,
} from './css-var'
import { StateEffect } from '@codemirror/state'

type UpdateCssVarEffectValue = {
  key: string
  value: CssVarValue
}

export type UpdateCssVarEffect = StateEffect<UpdateCssVarEffectValue>

type SaveCssVarsToStorageEffectValue = {
  storageKey?: string
  keys: string[]
}

export type SaveCssVarsToStorageEffect = StateEffect<SaveCssVarsToStorageEffectValue>

export const cssVar = <Fields extends Record<string, string | number>>({
  fields,
  targetDOM,
}: {
  fields: CssVarFields<Fields>
  targetDOM?: HTMLElement
}) => {
  return [
    ViewPlugin.define((view) => {
      const cssVarManager = new CssVarManager({
        fields,
        targetDOM: targetDOM ?? view.dom,
      })

      return new CssVarViewPlugin(view, cssVarManager)
    }),
  ]
}

export const updateCssVarEffect = StateEffect.define<UpdateCssVarEffectValue>()

export const updateCssVar = <Fields extends CssVarFields<any>>(view: EditorView) => {
  const effects: UpdateCssVarEffect[] = []

  const field = <Key extends CssVarKeys<Fields>>(key: Key, value: Fields[Key]) => {
    effects.push(
      updateCssVarEffect.of({
        key,
        value,
      }),
    )

    return {
      field,
      dispatch,
    }
  }

  const dispatch = () => {
    view.dispatch({ effects })
  }

  return {
    field,
    dispatch,
  }
}

export const saveCssVarsToStorageEffect = StateEffect.define<SaveCssVarsToStorageEffectValue>()

export const saveCssVarsToStorage = <Fields extends CssVarFields<any>>(
  view: EditorView,
  {
    storageKey = CSS_VARS_DEFAULT_STORAGE_KEY,
    keys,
  }: {
    storageKey?: string
    keys: CssVarKeys<Fields>[]
  },
) =>
  view.dispatch({
    effects: saveCssVarsToStorageEffect.of({
      storageKey,
      keys,
    }),
  })
