import * as commands from '@codemirror/commands'
import { type StateCommand } from '@codemirror/state'
import { type Command } from '@codemirror/view'

import { CodeMirrorEditor } from './editor'
import { CommandMap, PickCommands } from '../../typing'
import { isCodeMirrorCommand } from '../../utils'

export type CodeMirrorBaseCommands = PickCommands<typeof commands>

export const codeMirrorBaseCommands = Array.from(Object.entries(commands))
  .filter(([_, value]) => isCodeMirrorCommand(value))
  .reduce((commandMap, entry) => {
    const [key, command] = entry as [string, Command]

    return {
      ...commandMap,
      [key]: command,
    }
  }, {} as CodeMirrorBaseCommands)

export class CodeMirrorCommandManager<Commands extends CommandMap = CodeMirrorBaseCommands> {
  #editor: CodeMirrorEditor<any, any>
  commands: Commands

  constructor({ editor, commands }: { editor: CodeMirrorEditor<any, any>; commands?: Commands }) {
    this.#editor = editor
    this.commands = commands ?? (codeMirrorBaseCommands as unknown as Commands)
  }

  run<K extends keyof Commands>(commandName: K) {
    const editor = this.#editor
    const command = this.commands[commandName] as Command | StateCommand

    return command(editor.view)
  }
}
