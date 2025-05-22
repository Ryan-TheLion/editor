import { useAtomValue, useSetAtom } from 'jotai'
import {
  codeMirrorEditorAtoms,
  CodeMirrorEditorStoreAtom,
  codeMirrorEditorStoreDefaultValues,
} from './store'
import { useCallback } from 'react'
import { AnyCodeMirrorEditor, EditorContentPayload } from '@devrun_ryan/code-editor-core'

export const useCodeMirrorEditorAtomValue = <Key extends keyof CodeMirrorEditorStoreAtom>(
  key: Key,
) => {
  return useAtomValue(codeMirrorEditorAtoms[key])
}

export const useCodeMirrorEditorStoreActions = () => {
  const setEditor = useSetAtom(codeMirrorEditorAtoms.editor)

  const setEditorEditable = useSetAtom(codeMirrorEditorAtoms.editable)

  const setEditorLanguage = useSetAtom(codeMirrorEditorAtoms.language)
  const setEditorSupportedLanguages = useSetAtom(codeMirrorEditorAtoms.supportedLanguages)

  const setEditorContent = useSetAtom(codeMirrorEditorAtoms.content)
  const setEditorJson = useSetAtom(codeMirrorEditorAtoms.json)

  const setEditorThemeMode = useSetAtom(codeMirrorEditorAtoms.themeMode)

  const init = useCallback((editor: AnyCodeMirrorEditor) => {
    setEditor(editor)
    sync(editor)
  }, [])

  const sync = useCallback((editor: AnyCodeMirrorEditor) => {
    setEditorEditable(editor.editable)

    setEditorLanguage(editor.language)
    setEditorSupportedLanguages(editor.supportedLanguages)

    setEditorContentMap({
      text: editor.toText(),
      json: editor.toJSON(),
    })

    setEditorThemeMode(editor.themeMode!)
  }, [])

  const clear = useCallback(() => {
    setEditor(codeMirrorEditorStoreDefaultValues.editor)

    setEditorEditable(codeMirrorEditorStoreDefaultValues.editable)

    setEditorLanguage(codeMirrorEditorStoreDefaultValues.language)
    setEditorSupportedLanguages(codeMirrorEditorStoreDefaultValues.supportedLanguages)

    resetEditorContent()

    setEditorThemeMode(codeMirrorEditorStoreDefaultValues.themeMode)
  }, [])

  const setEditorContentMap = useCallback(({ text, json }: EditorContentPayload) => {
    setEditorContent(text)
    setEditorJson(json)
  }, [])

  const resetEditorContent = useCallback(() => {
    setEditorContent(codeMirrorEditorStoreDefaultValues.content)
    setEditorJson(codeMirrorEditorStoreDefaultValues.json)
  }, [])

  return {
    setEditor,
    setEditorEditable,
    setEditorLanguage,
    setEditorSupportedLanguages,
    setEditorContent,
    setEditorJson,
    setEditorThemeMode,
    init,
    sync,
    clear,
    setEditorContentMap,
    resetEditorContent,
  }
}
