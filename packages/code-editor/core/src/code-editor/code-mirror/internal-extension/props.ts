import { CodeMirrorEditorProps, EditorCompartments, editorProps, HeightValue } from '../editor'
import { StateEffect } from '@codemirror/state'
import { updateLanguageEffect } from './language'
import { updateEditableEffect } from './editable'
import { updateThemeEffect } from './theme'
import { activeLineNumberEffect } from './line-number'
import { EditorView } from '@codemirror/view'
import { activeFitContentEffect } from './fit-content'
import { CodeMirrorEditorDefaultLanguages, CodeMirrorEditorLanguages } from '../languages'

type Value<
  Languages extends CodeMirrorEditorLanguages<string>,
  MaxHeightValue extends HeightValue,
  Key extends keyof CodeMirrorEditorProps<Languages, MaxHeightValue>,
> = {
  [K in Key]-?: Required<CodeMirrorEditorProps<Languages, MaxHeightValue>>[K]
}[Key]

export const propsExtension = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  propsCompartments,
  initialProps,
}: {
  propsCompartments: EditorCompartments['props']
  initialProps: CodeMirrorEditorProps<Languages, MaxHeightValue>
}) => {
  const getUpdatePropEffect = <Key extends keyof CodeMirrorEditorProps<Languages, MaxHeightValue>>(
    key: Key,
    value: Value<Languages, MaxHeightValue, Key>,
  ): StateEffect<any> | null => {
    switch (key) {
      case 'editable': {
        return updateEditableEffect.of(value as Value<Languages, MaxHeightValue, 'editable'>)
      }
      case 'theme': {
        return updateThemeEffect.themeMap.of(value as Value<Languages, MaxHeightValue, 'theme'>)
      }
      case 'themeMode': {
        return updateThemeEffect.themeMode.of(
          value as Value<Languages, MaxHeightValue, 'themeMode'>,
        )
      }
      case 'language': {
        return updateLanguageEffect.of(value as string)
      }
      case 'lineNumber': {
        return activeLineNumberEffect.of(value as Value<Languages, MaxHeightValue, 'lineNumber'>)
      }
      case 'fitContent': {
        return activeFitContentEffect.of(value as Value<Languages, MaxHeightValue, 'fitContent'>)
      }
      default:
        return null
    }
  }

  return [
    propsCompartments.of(editorProps.of(initialProps as any)),
    EditorView.updateListener.of((update) => {
      const effect = update.transactions
        .flatMap((tr) => tr.effects)
        .findLast((effect) => effect.is(updatePropsEffect))

      if (!effect) return

      const currentProps = update.state.facet(editorProps.reader)
      const expectedProps = {
        ...currentProps,
        ...effect.value,
      }

      const changedProps = Object.fromEntries(
        Array.from(
          Object.entries(expectedProps).filter((entry) => {
            const [key, value] = entry as [
              keyof CodeMirrorEditorProps<Languages, MaxHeightValue>,
              CodeMirrorEditorProps<Languages, MaxHeightValue>[keyof CodeMirrorEditorProps],
            ]

            return currentProps[key] !== value
          }),
        ),
      )

      if (!Object.keys(changedProps).length) return

      const effects: StateEffect<any>[] = [
        propsCompartments.reconfigure(editorProps.of(expectedProps)),
      ]

      Array.from(Object.entries(changedProps)).forEach((entry) => {
        const [key, value] = entry as [
          keyof CodeMirrorEditorProps<Languages, MaxHeightValue>,
          CodeMirrorEditorProps<Languages, MaxHeightValue>,
        ]

        const effect = getUpdatePropEffect(key, value)

        if (!effect) return

        effects.push(effect)
      })

      update.view.dispatch({
        effects,
      })
    }),
  ]
}

type UpdatePropEffectValue = CodeMirrorEditorProps<CodeMirrorEditorLanguages<string>, any>

export const updatePropsEffect = StateEffect.define<Partial<UpdatePropEffectValue>>()
