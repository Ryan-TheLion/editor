import { lift, wrapIn } from 'prosemirror-commands'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../typing'
import { combineProsemirrorKeys } from '../utils'
import { NodeExtension } from './core'

export interface BlockquoteCommands {
  /** blockquote를 set */
  setBlockquote: Command
  /** blockquote 를 unset */
  unsetBlockquote: Command
  /** blockquote 노드가 있을 경우 unset, 없을 경우 set */
  toggleBlockquote: Command
}

export interface BlockquoteUtils {
  /** blockquote 노드가 존재하는지 반환 */
  isActive: () => boolean
}

type BlockquoteShortcutKeys = CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], '.']>

export type BlockquoteShortcut = Record<BlockquoteShortcutKeys, Command>

export const BLOCKQUOTE_NAME = 'blockquote' as const

/**
 * blockquote(`<blockquote>`) node extension
 *
 * **shortcut**
 * - `Mod-.`
 *   - `toggleBlockquote`
 */
export const Blockquote = NodeExtension.create<
  MergeConfigMap<{
    name: typeof BLOCKQUOTE_NAME
    commands: BlockquoteCommands
    utils: BlockquoteUtils
    shortcut: BlockquoteShortcut
  }>
>({
  name: BLOCKQUOTE_NAME,
  priority: 52,
  extendProseMirrorBaseNodeSpec: {
    key: 'blockquote',
  },
  commands({ nodeType, utils }) {
    return {
      setBlockquote(state, dispatch, view) {
        if (utils.isActive()) return false

        return wrapIn(nodeType)(state, dispatch, view)
      },
      unsetBlockquote(state, dispatch, view) {
        if (!utils.isActive()) return false

        return lift(state, dispatch, view)
      },
      toggleBlockquote(state, dispatch, view) {
        return utils.isActive()
          ? this.unsetBlockquote(state, dispatch, view)
          : this.setBlockquote(state, dispatch, view)
      },
    }
  },
  utils({ editor, nodeType }) {
    return {
      isActive() {
        return editor.isActive(nodeType)
      },
    }
  },
  shortcut({ commands }) {
    const keys = {
      toggleBlockquote: combineProsemirrorKeys('⌘', '.'),
    } as const

    return {
      [keys.toggleBlockquote /* ≑ Mod + '>' */]: commands.toggleBlockquote,
    }
  },
})
