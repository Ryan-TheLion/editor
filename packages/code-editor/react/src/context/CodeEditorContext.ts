import { CodeEditor } from "@devrun_ryan/code-editor-core";
import { createContext } from "react";

interface CodeEditorContextState {
  editor: CodeEditor | null
}

export const CodeEditorContext = createContext<CodeEditorContextState | null>(null)