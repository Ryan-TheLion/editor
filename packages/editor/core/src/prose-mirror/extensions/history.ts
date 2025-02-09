import { closeHistory, history, redo, redoDepth, undo, undoDepth } from 'prosemirror-history'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../typing'
import { combineProsemirrorKeys } from '../utils'
import { Extension } from './core'

export interface HistoryOptions {
  /**
   * The amount of history events that are collected before the oldest events are discarded. Defaults to 100.
   * - 가장 오래된 이벤트가 삭제되기 전에 수집되는 히스토리 이벤트의 양 (amount)
   * - 기본값은 100
   */
  depth?: number
  /** The delay between changes after which a new group should be started. Defaults to 500 (milliseconds). Note that when changes aren't adjacent, a new group is always started.
   * - 새 그룹이 시작되어야 하는 변경 사이의 지연 시간
   * - 기본값은 500밀리초(ms)
   * - 변경이 인접하지 않을 경우 항상 새 그룹이 시작된다는 점에 유의
   */
  newGroupDelay?: number
}

export interface HistoryCommand {
  /** 실행 취소 */
  undo: Command
  /** 복원 */
  redo: Command
}

export interface HistoryUtils {
  /** Set a flag on the given transaction that will prevent further steps from being appended to an existing history event (so that they require a separate undo command to undo). */
  closeHistory: typeof closeHistory
  /** The amount of undoable events available in a given state. */
  undoDepth: typeof undoDepth
  /** The amount of redoable events available in a given editor state. */
  redoDepth: typeof redoDepth
}

type HistoryShortcutKeys =
  | CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'z']>
  | CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'y']>

export type HistoryShortcut = Record<HistoryShortcutKeys, Command>

export const HISTORY_NAME = 'history' as const

/**
 * history extension
 *
 * **shortcut**
 * - 'Mod-z'
 *   - undo
 * - 'Mod-y'
 *   - redo
 *
 * **plugins**
 * - `prosemirror-history` 의 history
 */
export const History = Extension.create<
  MergeConfigMap<{
    name: typeof HISTORY_NAME
    commands: HistoryCommand
    utils: HistoryUtils
    shortcut: HistoryShortcut
  }>,
  HistoryOptions
>({
  name: 'history',
  options: {},
  commands() {
    return {
      undo,
      redo,
    }
  },
  utils() {
    return {
      closeHistory,
      undoDepth,
      redoDepth,
    }
  },
  shortcut({ commands }) {
    const keys = {
      undo: combineProsemirrorKeys('⌘', 'z'),
      redo: combineProsemirrorKeys('⌘', 'y'),
    } as const

    return {
      [keys.undo]: commands.undo,
      [keys.redo]: commands.redo,
    }
  },
  plugins({ options }) {
    return [history({ ...options })]
  },
})
