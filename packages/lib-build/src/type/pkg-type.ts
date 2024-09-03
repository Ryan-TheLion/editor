import codeEditorCorePkgJSON from '../../../code-editor/core/package.json' assert { type: 'json' }
import codeEditorPkgJSON from '../../../code-editor/package.json' assert { type: 'json' }
import codeEditorReactPkgJSON from '../../../code-editor/react/package.json' assert { type: 'json' }

export type PkgJSONType<Type, Extra = Record<any, any>> = {
  [key in keyof Type]: any
} & Extra

export type PartialPkgJSONType<Type, Extra = Record<any, any>> = Partial<PkgJSONType<Type, Extra>>

export interface EditorPkgJSON {
  editor: typeof codeEditorPkgJSON
  'editor:core': typeof codeEditorCorePkgJSON
  'editor:react': typeof codeEditorReactPkgJSON
}
