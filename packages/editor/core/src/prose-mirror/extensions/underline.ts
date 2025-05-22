import { toggleMark } from 'prosemirror-commands'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../typing'
import { combineProsemirrorKeys, setMark, unsetMark } from '../utils'
import { MarkExtension } from './core'

export interface UnderlineCommands {
  /** underline 서식 적용 */
  setUnderline: Command
  /** underline 서식 제거 */
  unsetUnderline: Command
  /** underline 서식이 적용되있을 경우 unset, 적용되있지 않을 경우 set */
  toggleUnderline: Command
}

export interface UnderlineUtils {
  /** underline 서식이 존재하는지 반환 */
  isActive: () => boolean
}

type UnderlineShortcutKeys = CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'u']>

export type UnderlineShortcut = Record<UnderlineShortcutKeys, Command>

export const UNDERLINE_NAME = 'underline' as const

/**
 * underline(`<u>`) mark extension
 *
 * **shortcut**
 *
 * - `Mod-u`
 *   - `toggleUnderline`
 */
export const Underline = MarkExtension.create<
  MergeConfigMap<{
    name: typeof UNDERLINE_NAME
    commands: UnderlineCommands
    utils: UnderlineUtils
    shortcut: UnderlineShortcut
  }>
>({
  name: UNDERLINE_NAME,
  markSpec() {
    return {
      group: 'inline',
      parseDOM: [
        {
          tag: 'u',
          getAttrs() {
            return {}
          },
        },
        {
          style: 'text-decoration',
          consuming: false,
          getAttrs(textDecoration) {
            return textDecoration === 'underline' ? {} : false
          },
        },
      ],
      toDOM() {
        return ['u', 0]
      },
    }
  },
  commands({ markType }) {
    return {
      setUnderline: setMark({ markType }),
      unsetUnderline: unsetMark(markType),
      toggleUnderline: toggleMark(markType),
    }
  },
  utils({ editor, markType }) {
    return {
      isActive() {
        return editor.isActive(markType)
      },
    }
  },
  shortcut({ commands }) {
    const keys = {
      toggleUnderline: combineProsemirrorKeys('⌘', 'u'),
    } as const

    return {
      [keys.toggleUnderline]: commands.toggleUnderline,
    }
  },
})
