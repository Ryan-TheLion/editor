import { ScopeProvider } from 'jotai-scope'
import { codeMirrorEditorAtomsArray } from './store'

interface Props {
  children: React.ReactNode
}

export const CodeMirrorEditorScope = ({ children }: Props) => {
  return <ScopeProvider atoms={codeMirrorEditorAtomsArray}>{children}</ScopeProvider>
}
