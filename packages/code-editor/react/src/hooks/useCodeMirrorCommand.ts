import { useCallback } from 'react'
import { useCodeMirrorEditor } from './useCodeMirrorEditor'
import { AnyCodeMirrorEditor, CodeMirrorBaseCommands } from '@devrun_ryan/code-editor-core'
import { Command } from '@devrun_ryan/code-editor-core/cm'

type UseCodeMirrorCommandReturn<C extends Command | keyof CodeMirrorBaseCommands | null = null> =
  C extends Command | keyof CodeMirrorBaseCommands
    ? (options?: { focus: boolean }) => boolean
    : AnyCodeMirrorEditor['runCommand']

export const useCodeMirrorCommand = <
  C extends Command | keyof CodeMirrorBaseCommands | null = null,
>(
  command?: C,
): UseCodeMirrorCommandReturn<C> => {
  const editor = useCodeMirrorEditor()

  const runCommand = useCallback(
    (...params: Parameters<AnyCodeMirrorEditor['runCommand']>) => {
      if (!editor) return

      return editor.runCommand(...params)
    },
    [editor],
  )

  if (command) {
    return (({ focus } = { focus: true }) =>
      runCommand(command, {
        focus,
      })) as UseCodeMirrorCommandReturn<Command> as UseCodeMirrorCommandReturn<C>
  }

  return runCommand as UseCodeMirrorCommandReturn<C>
}
