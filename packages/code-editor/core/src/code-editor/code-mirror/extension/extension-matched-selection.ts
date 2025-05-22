import { highlightSelectionMatches, selectNextOccurrence } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { codeEditorDarkThemeColors, codeEditorLightThemeColors } from '../theme/colors'
import { CodeMirrorStyleSpec, CodeMirrorThemeSpec, EditorThemeMode } from '../theme/editor-theme'
import { overrideObject } from '../../../utils'

type Config = Parameters<typeof highlightSelectionMatches>[0]

type OverrideStyleSpec = {
  light?: CodeMirrorStyleSpec
  dark?: CodeMirrorStyleSpec
}

export const highlightMatchedSelection = ({
  styleSpec,
  ...config
}: Partial<Config> & {
  styleSpec?: OverrideStyleSpec
} = {}) => {
  const getSpec = ({
    spec,
    mode,
  }: {
    spec: CodeMirrorStyleSpec
    mode: EditorThemeMode
  }): CodeMirrorThemeSpec | null => {
    if (!Object.keys(spec).length) return null

    const { color, display, height, ...specs } = spec

    return {
      [`&${mode}.cm-focused .cm-selectionMatch`]: {
        ...specs,
      },
      [`&${mode}.cm-focused .cm-selectionMatch > *`]: {
        color,
      },
    } as CodeMirrorThemeSpec
  }

  const overrideSpec = (baseSpec: CodeMirrorThemeSpec, sourceSpec?: CodeMirrorThemeSpec | null) => {
    return overrideObject(baseSpec, sourceSpec)
  }

  const defaultSpec: CodeMirrorThemeSpec = {
    '&:not(.cm-focused) .cm-selectionMatch': {
      background: 'transparent',
    },
    '&light.cm-focused .cm-selectionMatch': {
      display: 'inline-block',
      height: 'max-content',
      backgroundColor: codeEditorLightThemeColors.editor.selection,
    },
    '&dark.cm-focused .cm-selectionMatch': {
      display: 'inline-block',
      height: 'max-content',
      backgroundColor: codeEditorDarkThemeColors.editor.selection,
    },
  }

  const themeSpec = (() => {
    let result = {
      ...defaultSpec,
    }

    if (styleSpec?.light) {
      result = overrideSpec(result, getSpec({ spec: styleSpec.light, mode: 'light' }))
    }

    if (styleSpec?.dark) {
      result = overrideSpec(result, getSpec({ spec: styleSpec.dark, mode: 'dark' }))
    }

    return result
  })()

  const matchedSelectionKeymap = keymap.of([
    {
      key: 'Mod-d',
      run: (view) => {
        if (!view.state.facet(EditorState.allowMultipleSelections.reader)) return false
        if (!view.state.facet(EditorView.editable.reader)) return false

        return selectNextOccurrence({ state: view.state, dispatch: view.dispatch })
      },
      preventDefault: true,
    },
  ])

  return [
    EditorView.baseTheme(themeSpec),
    highlightSelectionMatches(config),
    matchedSelectionKeymap,
  ]
}
