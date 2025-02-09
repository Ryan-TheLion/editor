import { orderedList, wrapInList } from 'prosemirror-schema-list'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../../typing'
import { combineProsemirrorKeys } from '../../utils'
import { BulletList, ListItem, NodeExtension } from '..'

export interface OrderedListCommand {
  /** `wrapInList` */
  wrap: Command
  /**
   * - list 가 없는 경우: `OrderedList` 로 설정 (wrap)
   * - `BulletList` 인 경우: `OrderedList` 로 설정
   */
  setOrderedList: Command
  /** `OrderedList` 해제 */
  unsetOrderedList: Command
  /** `setOrderedList` 가 가능할 경우 `setOrderedList` 커맨드, `unsetOrderedList` 가 가능할 경우 `unsetOrderedList` 커맨드 실행 */
  toggleOrderedList: Command
}

export interface OrderedListUtils {
  /** `OrderedList` 노드가 있는지 반환 */
  isActive: () => boolean
}

type OrderedListShortcutKeys = CombineProsemirrorKeys<
  [ProsemirrorKeyboard['Mod'], ProsemirrorKeyboard['Shift'], 'o']
>

export type OrderedListShortcut = Record<OrderedListShortcutKeys, Command>

export const ORDERED_LIST_NODE_NAME = 'ordered_list' as const

/**
 * ordered list(`<ol>`, ex. `1. list1`) node extension
 */
export const OrderedList = NodeExtension.create<
  MergeConfigMap<{
    name: typeof ORDERED_LIST_NODE_NAME
    commands: OrderedListCommand
    utils: OrderedListUtils
    shortcut: OrderedListShortcut
  }>
>({
  name: ORDERED_LIST_NODE_NAME,
  nodeSpec() {
    return {
      ...orderedList,
      content: 'list_item+',
      group: 'block',
    }
  },
  commands({ utils, nodeType }) {
    return {
      wrap: wrapInList(nodeType),
      setOrderedList(state, dispatch, view) {
        const nearList = ListItem.utils.findNearList()

        const isActive = {
          orderedList: nearList && nearList.node.type === nodeType,
          bulletList: nearList && nearList.node.type === BulletList.nodeType,
        }

        if (!isActive.orderedList && !isActive.bulletList) {
          return this.wrap(state, dispatch, view)
        }

        if (!isActive.orderedList && isActive.bulletList) {
          if (dispatch) {
            dispatch(state.tr.setNodeMarkup(nearList!.pos, nodeType))
          }

          return true
        }

        return false
      },
      unsetOrderedList(state, dispatch, view) {
        const orderedListIsActive = utils.isActive()

        if (!orderedListIsActive) return false

        return ListItem.commands.liftListItem(state, dispatch, view)
      },
      toggleOrderedList(state, dispatch, view) {
        const canSetOrderedList = this.setOrderedList(state)
        if (canSetOrderedList) return this.setOrderedList(state, dispatch, view)

        const canUnsetOrderedList = this.unsetOrderedList(state)
        if (canUnsetOrderedList) return this.unsetOrderedList(state, dispatch, view)

        return false
      },
    }
  },
  utils({ nodeType }) {
    return {
      isActive() {
        const nearList = ListItem.utils.findNearList()

        if (!nearList) return false

        return nearList.node.type === nodeType
      },
    }
  },
  shortcut({ commands }) {
    const keys = {
      toggleOrderedList: combineProsemirrorKeys('⌘', 'Shift', 'o'),
    } as const

    return {
      [keys.toggleOrderedList]: commands.toggleOrderedList,
    }
  },
})
