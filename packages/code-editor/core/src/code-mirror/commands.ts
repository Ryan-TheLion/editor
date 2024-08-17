import * as commands from '@codemirror/commands'
import { type StateCommand } from '@codemirror/state'
import { type Command } from '@codemirror/view'

import { CodeEditor } from './code-editor'

type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type BaseCommandKeys = FunctionKeys<typeof commands>

type CommandMap = Record<BaseCommandKeys, Command | StateCommand>

const baseCommands = Array.from(Object.entries(commands))
  // eslint-disable-next-line
  .filter(([_, value]) => typeof value === 'function')
  .reduce((commandMap, [key, command]) => {
    commandMap[key as BaseCommandKeys] = command as Command | StateCommand

    return commandMap
  }, {} as CommandMap)

export class CommandManager {
  editor: CodeEditor
  commands: CommandMap

  constructor({ editor }: { editor: CodeEditor }) {
    this.editor = editor
    this.commands = baseCommands
  }

  run<K extends keyof CommandMap>(commandName: K) {
    const command = this.commands[commandName]
    const commandParams = command.toString().match(/\(([^)]*)\)/)

    const isStateCommand = commandParams![1]!.startsWith('{')

    const commandResult = isStateCommand
      ? (command as StateCommand)({
          state: this.editor.view.state,
          dispatch: this.editor.view.dispatch,
        })
      : (command as Command)(this.editor.view)

    return commandResult
  }
}
