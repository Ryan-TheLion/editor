import { toggleMark } from 'prosemirror-commands'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../typing'
import { combineProsemirrorKeys, setMark, unsetMark } from '../utils'
import { MarkExtension } from './core'

export interface ItalicCommand {
  /** italic 서식 적용 */
  setItalic: Command
  /** italic 서식 제거 */
  unsetItalic: Command
  /** italic 서식이 적용되있을 경우 unset, 적용되있지 않을 경우 set */
  toggleItalic: Command
}

export interface ItalicUtils {
  /** italic 서식이 존재하는지 반환 */
  isActive: () => boolean
}

type ItalicShortcutKeys = CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'i']>

export type ItalicShortcut = Record<ItalicShortcutKeys, Command>

export const ITALIC_NAME = 'italic' as const

/**
 * italic(`<i>`, `<em>`) mark extension
 *
 * **shortcut**
 *
 * - `Mod-i`
 *   - `toggleItalic` 커맨드
 */
export const Italic = MarkExtension.create<
  MergeConfigMap<{
    name: typeof ITALIC_NAME
    commands: ItalicCommand
    utils: ItalicUtils
    shortcut: ItalicShortcut
  }>
>({
  name: ITALIC_NAME,
  extendProseMirrorBaseMarkSpec: {
    key: 'em',
  },
  commands({ markType }) {
    return {
      setItalic: setMark({ markType }),
      unsetItalic: unsetMark(markType),
      toggleItalic: toggleMark(markType),
    }
  },
  utils({ editor, markType }) {
    return {
      isActive: () => {
        return editor.isActive(markType)
      },
    }
  },
  shortcut({ commands }) {
    const keys = {
      toggleItalic: combineProsemirrorKeys('⌘', 'i'),
    } as const

    return {
      [keys.toggleItalic]: commands.toggleItalic,
    }
  },
})
