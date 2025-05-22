import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../../typing'
import { Extension } from '../core'
import { HardBreak } from './hard-break'

export interface SoftBreakCommand {
  /** soft break */
  softBreak: Command
}

type SoftBreakShortcutKeys = CombineProsemirrorKeys<
  [ProsemirrorKeyboard['Alt'], ProsemirrorKeyboard['Enter']]
>

export type SoftBreakShortcut = Record<SoftBreakShortcutKeys, Command>

export const SOFT_BREAK_NAME = 'soft_break' as const

/**
 * soft break
 * - 새로운 라인없이 같은 요소 내에서 줄 바꿈
 * @example
 * ```html
 * <p>
 *   text
 *   <br>
 *   text2
 *   <br>
 * </p>
 * ```
 *
 * **shortcut**
 * - `Alt` + `Enter`
 *   - soft break
 */
export const SoftBreak = Extension.create<
  MergeConfigMap<{
    name: typeof SOFT_BREAK_NAME
    commands: SoftBreakCommand
    shortcut: SoftBreakShortcut
  }>
>({
  name: SOFT_BREAK_NAME,
  commands() {
    return {
      softBreak: (state, dispatch, view) => {
        if (view && !view.editable) return false

        const brNodeType = HardBreak.nodeType

        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(brNodeType.create()).scrollIntoView())
        }

        return true
      },
    }
  },
  shortcut({ commands }) {
    return {
      'Alt-Enter': commands.softBreak,
    }
  },
})
