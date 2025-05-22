import { Compartment, EditorState, StateEffect } from '@codemirror/state'
import {
  editorColors,
  EditorThemeMap,
  editorThemeMap,
  EditorThemeMode,
  editorThemeMode,
} from '../theme/editor-theme'
import { editorCssVarManager } from '../extension'
import { kababCaseKeyEditorColors } from '../theme/colors'

export const themeExtension = ({
  themeCompartment,
  initial,
}: {
  themeCompartment: { map: Compartment; mode: Compartment; extension: Compartment }
  initial: {
    theme: EditorThemeMap
    themeMode: EditorThemeMode
  }
}) => {
  return [
    // EditorThemeMode 초기화
    themeCompartment.mode.of(editorThemeMode.of(initial.themeMode)),
    // EditorTheme 초기화
    themeCompartment.extension.of(initial.theme[initial.themeMode]),
    themeCompartment.map.of(editorThemeMap.of(initial.theme)),
    // EditorTheme 업데이트
    EditorState.transactionExtender.of((tr) => {
      const effect = tr.effects.findLast((effect) => effect.is(updateThemeEffect.themeMap))

      if (!effect) return {}

      const currentThemeMap = tr.state.facet(editorThemeMap.reader)
      const expectedThemeMap = effect.value

      if (currentThemeMap === expectedThemeMap) return {}

      const themeMode = tr.state.facet(editorThemeMode.reader)

      if (!themeMode) return {}

      const cssVarManager = tr.state.facet(editorCssVarManager.reader)

      const previewTr = tr.state.update({
        effects: themeCompartment.extension.reconfigure(expectedThemeMap[themeMode]),
      })

      const currentColors = tr.state.facet(editorColors.reader)
      const expectedColors = previewTr.state.facet(editorColors.reader)

      if (cssVarManager && currentColors !== expectedColors) {
        const editorColorCssVarFields = kababCaseKeyEditorColors(expectedColors!.editor)

        cssVarManager.updateCssVar({
          ...editorColorCssVarFields,
        })
      }

      return {
        effects: [
          themeCompartment.map.reconfigure(editorThemeMap.of(expectedThemeMap)),
          themeCompartment.extension.reconfigure(expectedThemeMap[themeMode]),
        ],
      }
    }),
    EditorState.transactionExtender.of((tr) => {
      const effect = tr.effects.findLast((effect) => effect.is(updateThemeEffect.themeMode))

      if (!effect) return {}

      const currentThemeMode = tr.state.facet(editorThemeMode.reader)
      const expectedThemeMode = effect.value

      if (currentThemeMode === expectedThemeMode) return {}

      const effects: StateEffect<any>[] = [
        themeCompartment.mode.reconfigure(editorThemeMode.of(expectedThemeMode)),
      ]

      const themeMap = tr.state.facet(editorThemeMap)

      if (themeMap) {
        const cssVarManager = tr.state.facet(editorCssVarManager.reader)

        const previewTr = tr.state.update({
          effects: themeCompartment.extension.reconfigure(themeMap[expectedThemeMode]),
        })

        const currentColors = tr.state.facet(editorColors.reader)
        const expectedColors = previewTr.state.facet(editorColors.reader)

        if (cssVarManager && currentColors !== expectedColors) {
          const editorColorCssVarFields = kababCaseKeyEditorColors(expectedColors!.editor)

          cssVarManager.updateCssVar({
            ...editorColorCssVarFields,
          })
        }

        effects.push(themeCompartment.extension.reconfigure(themeMap[expectedThemeMode]))
      }

      return {
        effects,
      }
    }),
  ]
}

export const updateThemeEffect = {
  themeMap: StateEffect.define<EditorThemeMap>(),
  themeMode: StateEffect.define<EditorThemeMode>(),
}
