import { Command, TextSelection } from 'prosemirror-state'

import { Editor } from '../../../editor'
import { isNodeSelection } from '../../utils'

export interface CommandListError {
  by: string
  error: Error
}

export class CommandList {
  private editor: Editor
  private stack: Command[]

  constructor({ editor, stack }: { editor: Editor; stack: Command[] }) {
    this.editor = editor
    this.stack = stack
  }

  append(command: Command) {
    this.stack.push(command)
  }

  pop() {
    this.stack = this.stack.filter((_, index) => index !== this.stack.length - 1)
  }

  resolve(
    errorsCallback?:
      | ((errors: CommandListError[]) => void)
      | ((errors: CommandListError[]) => Promise<void>),
  ) {
    const errors: CommandListError[] = []

    for (const command of this.stack) {
      try {
        const state = this.editor.state
        const view = this.editor.view

        command(state, view.dispatch, view)
      } catch (error) {
        if (errorsCallback) {
          errors.push({
            by: command.name,
            error: error as Error,
          })

          continue
        }

        throw error
      }
    }

    if (errors.length && errorsCallback) {
      errorsCallback(errors)
    }

    return {
      focus: this.focus.bind(this),
    }
  }

  private focus({ at }: { at?: 'from' | 'to' } = {}) {
    const tr = this.editor.view.state.tr
    const dispatch = this.editor.view.dispatch

    const editorSeletionIsNodeSelection = isNodeSelection(this.editor.state.selection)

    if (editorSeletionIsNodeSelection) {
      tr.scrollIntoView()

      dispatch(tr)

      return
    }

    if (at) {
      const { $from, $to } = tr.selection
      const $near = at === 'from' ? $from : $to

      tr.setSelection(TextSelection.near($near))

      dispatch(tr)
    }

    this.editor.focus()
  }
}
