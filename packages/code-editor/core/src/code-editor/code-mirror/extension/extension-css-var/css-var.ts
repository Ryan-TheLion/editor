import { EditorView, PluginValue, ViewUpdate } from '@codemirror/view'
import {
  saveCssVarsToStorageEffect,
  SaveCssVarsToStorageEffect,
  UpdateCssVarEffect,
  updateCssVarEffect,
} from './extension'
import { styleMapToText, styleTextToMap } from '../../../../utils'
import {
  codeEditorDarkThemeColors,
  codeEditorLightThemeColors,
  CodeEditorThemeColors,
  kababCaseKeyEditorColors,
} from '../../theme/colors'
import { EditorCssVarFields, EditorThemeMode } from '../../theme'
import { editorColors } from '../../theme/editor-theme'
import { Facet } from '@codemirror/state'
import { CamelCaseToKebabCase, FlattenKeys, GetNestedKebabValue } from '../../../../typing'

export type CssVarValue = string | number

export type CssVarKeys<Fields extends Record<string, CssVarValue>> = keyof Fields extends infer K
  ? K extends string
    ? CamelCaseToKebabCase<K> extends ''
      ? never
      : CamelCaseToKebabCase<K>
    : never
  : never

export type CssVarFields<Fields extends Record<string, CssVarValue>> = {
  [Key in keyof Fields as CamelCaseToKebabCase<Key & string> extends ''
    ? never
    : CamelCaseToKebabCase<Key & string>]: Fields[Key]
}

type GetNestedCssVarKebabValue<T, Path extends string> = Path extends `${infer L}-${infer R}`
  ? L extends keyof T
    ? T[L] extends Record<string, any>
      ? GetNestedKebabValue<T[L], R>
      : never
    : `${L}${Capitalize<R>}` extends keyof T
      ? T[`${L}${Capitalize<R>}`] extends CssVarValue
        ? T[`${L}${Capitalize<R>}`]
        : never
      : never
  : Path extends keyof T
    ? T[Path] extends CssVarValue
      ? T[Path]
      : never
    : never

export type PrefixVarFields<Prefix extends string, Fields extends Record<string, any>> = {
  [K in `${Prefix}-${CamelCaseToKebabCase<FlattenKeys<Fields, '-'>>}`]: GetNestedCssVarKebabValue<
    Fields,
    K extends `${Prefix}-${infer N}` ? N : K
  >
}

type CssVarMapKeys<Fields extends Record<string, CssVarValue>> = keyof Fields extends infer K
  ? K extends CssVarKeys<Fields>
    ? `--cm-editor-${K}`
    : never
  : never

type FixPrefix<S extends string> = S extends `--cm-editor-${infer K}` ? K : never

export type CssVarMap<Fields extends CssVarFields<any>> = {
  [Key in CssVarMapKeys<Fields>]: FixPrefix<Key> extends keyof Fields
    ? Fields[FixPrefix<Key>]
    : never
}

export type CssVarViewPluginParam<Fields extends Record<string, CssVarValue>> = {
  fields: CssVarFields<Fields>
  targetDOM: HTMLElement
  storageKey?: string
}

export const CSS_VARS_DEFAULT_STORAGE_KEY = 'cm-editor-css-vars'

export class CssVarManager<Fields extends Record<string, CssVarValue>> {
  #fields: CssVarFields<Fields>
  #storageKey: string

  dom: HTMLElement

  constructor({
    fields,
    targetDOM,
    storageKey = CSS_VARS_DEFAULT_STORAGE_KEY,
  }: CssVarViewPluginParam<Fields>) {
    this.#fields = fields
    this.#storageKey = storageKey

    this.dom = targetDOM

    this.#applyDOM()
  }

  get keys() {
    return Array.from(Object.keys(this.#fields)) as CssVarKeys<Fields>[]
  }

  get cssVarMap() {
    return fieldsToMap(this.#fields)
  }

  get cssVarStyleText() {
    return cssVarStyleText(this.#fields)
  }

  get storageKey() {
    return this.#storageKey
  }

  static cssVars = <TargetFields extends Record<string, CssVarValue>>(
    fields: CssVarFields<TargetFields>,
  ) => {
    return {
      get<Key extends CssVarKeys<TargetFields>>(key: Key) {
        return {
          name: `--cm-editor-${key}` as const,
          value: fields[key],
          varFormat: this.varFormat(key),
        }
      },
      varFormat<Key extends CssVarKeys<TargetFields>>(
        key: Key,
        fallback?: CssVarFields<TargetFields>[Key],
      ) {
        const name = `--cm-editor-${key}`
        const fallbackValue = fallback ?? fields[key]

        return `var(${name}, ${fallbackValue})`
      },
      keys: Array.from(Object.keys(fields)) as CssVarKeys<TargetFields>[],
      styleText: cssVarStyleText(fields),
    }
  }

  cssVar<Key extends CssVarKeys<Fields>>(key: Key) {
    return {
      name: `--cm-editor-${key}` as const,
      value: this.#fields[key],
    }
  }

  updateCssVar(fields: Partial<CssVarFields<Fields>>) {
    this.#fields = {
      ...this.#fields,
      ...fields,
    }

    this.#applyDOM()
  }

  #applyDOM = () => {
    const styleMap = {
      ...styleTextToMap(this.dom.style.cssText),
      ...this.cssVarMap,
    }

    this.dom.style.cssText = styleMapToText(styleMap)
  }

  #getCurrentLocalStorage = (): CssVarFields<any> => {
    const storageCssVars = localStorage.getItem(this.#storageKey)

    if (!storageCssVars) return {}

    return JSON.parse(storageCssVars)
  }

  clearFromLocalStorage() {
    const currentCssVarStorage = this.#getCurrentLocalStorage()

    if (!Object.keys(currentCssVarStorage).length) return

    localStorage.setItem(this.storageKey, '')
  }

  removeFromLocalStorage() {
    localStorage.removeItem(this.storageKey)
  }

  saveToLocalStorage(keys: CssVarKeys<CssVarFields<Fields>>[]) {
    const currentStorage = this.#getCurrentLocalStorage()

    const target = (() => {
      if (!keys?.length) return {}

      const fields = Array.from(keys).reduce((targetFields, key) => {
        if (key in this.#fields) {
          return {
            ...targetFields,
            [key]: this.#fields[key as keyof CssVarFields<Fields>],
          }
        }

        return {
          ...targetFields,
        }
      }, {} as CssVarFields<Fields>)

      return fields
    })()

    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        ...currentStorage,
        ...target,
      }),
    )
  }
}

export const createEditorCssVarFields = <Colors extends CodeEditorThemeColors>(colors: Colors) => {
  return {
    'font-size': '13px',
    ...kababCaseKeyEditorColors(colors.editor),
  } as unknown as EditorCssVarFields<Colors>
}

export const createEditorCssVarManager = ({
  view,
  themeMode,
}: {
  view: EditorView
  themeMode: EditorThemeMode
}) => {
  const colors = (() => {
    const currentColors = view.state.facet(editorColors.reader)

    if (currentColors) return currentColors

    return themeMode === 'light' ? codeEditorLightThemeColors : codeEditorDarkThemeColors
  })()

  return new CssVarManager({
    fields: createEditorCssVarFields(colors),
    targetDOM: view.dom,
  })
}

export class CssVarViewPlugin<Fields extends Record<string, string | number>>
  implements PluginValue
{
  view: EditorView

  cssVarManager: CssVarManager<Fields>

  constructor(view: EditorView, cssVarManager: CssVarManager<Fields>) {
    this.view = view

    this.cssVarManager = cssVarManager
  }

  update(update: ViewUpdate): void {
    const cssVarEffects = update.transactions
      .flatMap((tr) => tr.effects)
      .reduce<{
        update: UpdateCssVarEffect[]
        save: SaveCssVarsToStorageEffect[]
      }>(
        (effects, effect) => {
          ;(() => {
            if (effect.is(updateCssVarEffect)) {
              effects.update.push(effect)

              return
            }

            if (effect.is(saveCssVarsToStorageEffect)) {
              effects.save.push(effect)

              return
            }
          })()

          return effects
        },
        {
          update: [],
          save: [],
        },
      )

    if (cssVarEffects.update.length) {
      let update: Partial<CssVarFields<any>> = {}

      for (const updateEffect of cssVarEffects.update) {
        const { key, value } = updateEffect.value

        if (!this.cssVarManager.keys.includes(key as (typeof this.cssVarManager.keys)[number]))
          continue

        update = {
          ...update,
          [key]: value,
        }
      }

      this.cssVarManager.updateCssVar(update)
    }

    if (cssVarEffects.save.length) {
      const keys = new Set<CssVarKeys<CssVarFields<Fields>>>()

      let canSave = false

      for (const saveEffect of cssVarEffects.save) {
        const { storageKey = CSS_VARS_DEFAULT_STORAGE_KEY, keys: targetKeys } = saveEffect.value

        if (storageKey !== this.cssVarManager.storageKey) continue

        targetKeys.forEach((targetKey) => {
          this.cssVarManager.keys.includes(targetKey as CssVarKeys<Fields>) &&
            keys.add(targetKey as CssVarKeys<CssVarFields<Fields>>)
        })

        if (!keys.size) continue

        canSave = true
      }

      canSave && this.cssVarManager.saveToLocalStorage(Array.from(keys))
    }
  }
}

export const editorCssVarManager = Facet.define<
  { view: EditorView; themeMode: EditorThemeMode },
  CssVarManager<EditorCssVarFields<CodeEditorThemeColors>> | null
>({
  combine([params]) {
    if (!params) return null

    return createEditorCssVarManager(params)
  },
  static: true,
})

//

const fieldsToMap = <TargetFields extends CssVarFields<any>>(fields: TargetFields) => {
  return Array.from(Object.entries(fields)).reduce((editorCssVarFields, [key, value]) => {
    const cssVarName = `--cm-editor-${key}` as CssVarMapKeys<TargetFields>

    return {
      ...editorCssVarFields,
      [cssVarName]: value,
    }
  }, {} as CssVarMap<TargetFields>)
}

const cssVarStyleText = <Fields extends CssVarFields<any>>(fields: Fields) => {
  return Array.from(Object.entries(fieldsToMap(fields)))
    .map(([name, value]) => {
      return `${name}:${value}`
    })
    .join(';')
}
