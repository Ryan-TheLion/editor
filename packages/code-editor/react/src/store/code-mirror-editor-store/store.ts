import {
  AnyCodeMirrorEditor,
  DEFAULT_CODE_MIRROR_EDITOR_CONFIG,
} from '@devrun_ryan/code-editor-core'
import { EditorThemeMode } from '@devrun_ryan/code-editor-core/code-editor/code-mirror/theme'
import { atom } from 'jotai'
import { focusAtom } from 'jotai-optics'

export interface CodeMirrorEditorStoreAtom {
  editor: AnyCodeMirrorEditor | null
  editable: AnyCodeMirrorEditor['editable']
  language: AnyCodeMirrorEditor['language']
  supportedLanguages: AnyCodeMirrorEditor['supportedLanguages']
  content: string
  json: Record<any, any>
  themeMode: EditorThemeMode
}

export const codeMirrorEditorStoreDefaultValues: CodeMirrorEditorStoreAtom = {
  editor: null,
  editable: false,
  language: '',
  supportedLanguages: [],
  content: '',
  json: {},
  themeMode: DEFAULT_CODE_MIRROR_EDITOR_CONFIG.themeMode,
}

const codeMirrorEditorStoreAtom = atom<CodeMirrorEditorStoreAtom>({
  ...codeMirrorEditorStoreDefaultValues,
})

export const codeMirrorEditorAtoms = {
  editor: focusAtom(codeMirrorEditorStoreAtom, (optic) => optic.prop('editor')),
  editable: focusAtom(codeMirrorEditorStoreAtom, (optic) => optic.prop('editable')),
  language: focusAtom(codeMirrorEditorStoreAtom, (optic) => optic.prop('language')),
  supportedLanguages: focusAtom(codeMirrorEditorStoreAtom, (optic) =>
    optic.prop('supportedLanguages'),
  ),
  content: focusAtom(codeMirrorEditorStoreAtom, (optic) => optic.prop('content')),
  json: focusAtom(codeMirrorEditorStoreAtom, (optic) => optic.prop('json')),
  themeMode: focusAtom(codeMirrorEditorStoreAtom, (optic) => optic.prop('themeMode')),
}

export const codeMirrorEditorAtomsArray = Array.from(Object.values(codeMirrorEditorAtoms))
