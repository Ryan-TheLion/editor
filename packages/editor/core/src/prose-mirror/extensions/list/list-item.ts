import { Attrs, Node } from 'prosemirror-model'
import {
  liftListItem,
  listItem,
  sinkListItem,
  splitListItem,
  splitListItemKeepMarks,
} from 'prosemirror-schema-list'
import { Command } from 'prosemirror-state'

import { CombineProsemirrorKeys, MergeConfigMap, ProsemirrorKeyboard } from '../../../typing'
import { combineProsemirrorKeys, PROSEMIRROR_KEYBOARD } from '../../utils'
import { NodeExtension } from '../core'

export interface ListItemCommand {
  sinkListItem: Command
  liftListItem: Command
  splitListItem: (attrs?: Attrs) => Command
  splitListItemKeepMarks: (attrs?: Attrs) => Command
}

type ListItemShortcutKeys =
  | ProsemirrorKeyboard['Tab']
  | CombineProsemirrorKeys<[ProsemirrorKeyboard['Shift'], ProsemirrorKeyboard['Tab']]>
  | ProsemirrorKeyboard['Enter']

export type ListItemShortcut = Record<ListItemShortcutKeys, Command>

export interface ListItemUtils {
  /** 현재 list item 노드 인 경우, 부모 list 노드(ex. ordered list) 반환 */
  findNearList: () => { node: Node; pos: number } | null
}

export const LIST_ITEM_NODE_NAME = 'list_item' as const

/**
 * list item(`<li>`) node extension
 */
export const ListItem = NodeExtension.create<
  MergeConfigMap<{
    name: typeof LIST_ITEM_NODE_NAME
    commands: ListItemCommand
    shortcut: ListItemShortcut
    utils: ListItemUtils
  }>
>({
  name: LIST_ITEM_NODE_NAME,
  nodeSpec() {
    return {
      ...listItem,
      content: 'paragraph block*',
    }
  },
  commands({ nodeType }) {
    return {
      sinkListItem: sinkListItem(nodeType),
      liftListItem: liftListItem(nodeType),
      splitListItem(attrs) {
        return splitListItem(nodeType, attrs)
      },
      splitListItemKeepMarks(attrs) {
        return splitListItemKeepMarks(nodeType, attrs)
      },
    }
  },
  shortcut({ commands }) {
    const keys = {
      indent: PROSEMIRROR_KEYBOARD.Tab,
      outdent: combineProsemirrorKeys('Shift', 'Tab'),
      splitListItem: PROSEMIRROR_KEYBOARD.Enter,
    } as const

    return {
      [keys.indent]: commands.sinkListItem,
      [keys.outdent]: commands.liftListItem,
      [keys.splitListItem]: commands.splitListItem(),
    }
  },
  utils({ editor, nodeType }) {
    return {
      findNearList() {
        const { $from } = editor.state.selection

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          const pos = $from.before(depth)

          if (node.type === nodeType) {
            const { parent } = editor.state.doc.resolve(pos)

            return {
              node: parent,
              pos: $from.before(depth - 1),
            }
          }
        }

        return null
      },
    }
  },
})
