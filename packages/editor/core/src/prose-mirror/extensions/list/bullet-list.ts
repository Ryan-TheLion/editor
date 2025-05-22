import { bulletList, wrapInList } from 'prosemirror-schema-list'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../../typing'
import { combineProsemirrorKeys } from '../../utils'
import { ListItem, NodeExtension, OrderedList } from '..'

export interface BulletListCommand {
  /** `wrapInList` */
  wrap: Command
  /**
   * - list 가 없는 경우: `BulletList` 로 설정 (wrap)
   * - `OrderedList` 인 경우: `BulletList` 로 설정
   */
  setBulletList: Command
  /** `BulletList` 해제 */
  unsetBullteList: Command
  /** `setBulletList` 가 가능할 경우 `setBulletList` 커맨드, `unsetBulletList` 가 가능할 경우 `unsetOrderedList` 커맨드 실행 */
  toggleBulletList: Command
}

export interface BulletListUtils {
  /** `BulletList` 노드가 있는지 반환 */
  isActive: () => boolean
}

type BulletListShortcutKeys = CombineProsemirrorKeys<
  [ProsemirrorKeyboard['Mod'], ProsemirrorKeyboard['Shift'], 'u']
>

export type BulletListShortcut = Record<BulletListShortcutKeys, Command>

export const BULLET_LIST_NODE_NAME = 'bullet_list' as const

/**
 * bullet list(`<ul>`, ex. `• list1`) node extension
 */
export const BulletList = NodeExtension.create<
  MergeConfigMap<{
    name: typeof BULLET_LIST_NODE_NAME
    commands: BulletListCommand
    utils: BulletListUtils
    shortcut: BulletListShortcut
  }>
>({
  name: BULLET_LIST_NODE_NAME,
  nodeSpec() {
    return {
      ...bulletList,
      content: 'list_item+',
      group: 'block',
    }
  },
  commands({ utils, nodeType }) {
    return {
      wrap: wrapInList(nodeType),
      setBulletList(state, dispatch, view) {
        const nearList = ListItem.utils.findNearList()

        const isActive = {
          orderedList: nearList && nearList.node.type === OrderedList.nodeType,
          bulletList: nearList && nearList.node.type === nodeType,
        }

        if (!isActive.bulletList && !isActive.orderedList) {
          return this.wrap(state, dispatch, view)
        }

        if (!isActive.bulletList && isActive.orderedList) {
          if (dispatch) {
            dispatch(state.tr.setNodeMarkup(nearList!.pos, nodeType))
          }

          return true
        }

        return false
      },
      unsetBullteList(state, dispatch, view) {
        const bulletListIsActive = utils.isActive()

        if (!bulletListIsActive) return false

        return ListItem.commands.liftListItem(state, dispatch, view)
      },
      toggleBulletList(state, dispatch, view) {
        const canSetBulletList = this.setBulletList(state)
        if (canSetBulletList) return this.setBulletList(state, dispatch, view)

        const canUnsetBulletList = this.unsetBullteList(state)
        if (canUnsetBulletList) return this.unsetBullteList(state, dispatch, view)

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
      toggleBulletList: combineProsemirrorKeys('⌘', 'Shift', 'u'),
    } as const

    return {
      [keys.toggleBulletList]: commands.toggleBulletList,
    }
  },
})
