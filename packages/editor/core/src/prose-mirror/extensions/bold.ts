import { toggleMark } from 'prosemirror-commands'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../typing'
import { combineProsemirrorKeys, setMark, unsetMark } from '../utils'
import { MarkExtension } from './core'

export interface BoldCommands {
  /** bold 서식 적용 */
  setBold: Command
  /** bold 서식 제거 */
  unsetBold: Command
  /** bold 서식이 적용되있을 경우 제거, 적용되있지 않은 경우 설정 */
  toggleBold: Command
}

export interface BoldUtils {
  /** bold 서식이 존재하는지 반환 */
  isActive: () => boolean
}

type BoldShortcutKeys = CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'b']>

export type BoldShortcut = Record<BoldShortcutKeys, Command>

export const BOLD_NAME = 'bold' as const

/**
 * bold(`<b>`, `<strong>`) mark extension
 *
 * **shortcut**
 *
 * - `Mod-b`
 *   - `toggleBold` 커맨드
 */
export const Bold = MarkExtension.create<
  MergeConfigMap<{
    name: typeof BOLD_NAME
    commands: BoldCommands
    utils: BoldUtils
    shortcut: BoldShortcut
  }>
>({
  name: BOLD_NAME,
  extendProseMirrorBaseMarkSpec: {
    key: 'strong',
  },
  commands({ markType }) {
    return {
      setBold: setMark({ markType }),
      unsetBold: unsetMark(markType),
      toggleBold: toggleMark(markType),
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
      toggleBold: combineProsemirrorKeys('⌘', 'b'),
    } as const

    return {
      [keys.toggleBold]: commands.toggleBold,
    }
  },
})
