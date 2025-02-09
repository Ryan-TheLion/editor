import { Command, Selection, TextSelection } from 'prosemirror-state'

import { MergeConfigMap } from '../../typing'
import {
  deleteSelectedNode,
  insertNewLineAtNextBlock,
  insertNewLineAtPrevBlock,
  isNodeSelection,
  isSelectedNode,
  nextLineNode,
  prevLineNode,
} from '../utils'
import { NodeExtension } from './core'
import { Paragraph } from './paragraph'

export interface HorizontalRuleCommands {
  /** 수평선(hr) 삽입 커맨드 */
  setHorizontalRule: Command
  /** 수평선(hr) 삭제 커맨드 */
  unsetHorizontalRule: Command
  /** 수평선(hr)이 선택되어있을 경우 삭제, 선택되어있지 않은 경우 삽입 */
  toggleHorzontalRule: Command
}

export interface HorizontalRuleUtils {
  /** 수평선 노드가 활성화된 상태인지(선택되었는지) 유무 (= isActive) */
  horizontalRuleIsSelected: (param?: { selection?: Selection }) => boolean
}

export const HORIZONTAL_RULE_NAME = 'horizontal_rule' as const

/**
 * 수평선(`hr`) node extension
 */
export const HorizontalRule = NodeExtension.create<
  MergeConfigMap<{
    name: typeof HORIZONTAL_RULE_NAME
    commands: HorizontalRuleCommands
    utils: HorizontalRuleUtils
  }>
>({
  name: HORIZONTAL_RULE_NAME,
  extendProseMirrorBaseNodeSpec: {
    key: 'horizontal_rule',
  },
  commands({ editor, nodeType }) {
    return {
      setHorizontalRule(state, dispatch, view) {
        if (view && !view.editable) return false

        if (isNodeSelection(state.selection)) return false

        if (dispatch) {
          const tr = state.tr

          const horizontalRuleNode = nodeType.create()
          const paragraphNode = Paragraph.nodeType.create()

          let lineNodeAt = {
            prev: prevLineNode({ state }),
            next: nextLineNode({ state }),
          }

          if (lineNodeAt.prev && lineNodeAt.next) {
            tr.replaceWith(tr.selection.$from.pos, tr.selection.$to.pos, [
              horizontalRuleNode,
              paragraphNode,
            ])

            tr.setSelection(
              TextSelection.near(
                tr.doc.resolve(tr.selection.$to.after(1) + horizontalRuleNode.nodeSize),
              ),
            )

            dispatch(tr)

            return true
          }

          if (lineNodeAt.prev?.type.name === nodeType.name && !lineNodeAt.next) {
            tr.replaceSelectionWith(paragraphNode)
            tr.insert(tr.selection.$to.after(1), [horizontalRuleNode, paragraphNode])

            dispatch(tr)

            return true
          }

          tr.replaceSelectionWith(horizontalRuleNode)

          let updatedState = state.apply(tr)

          lineNodeAt = {
            prev: prevLineNode({ state: updatedState }),
            next: nextLineNode({ state: updatedState }),
          }

          if (!lineNodeAt.prev) {
            insertNewLineAtPrevBlock({ state: updatedState, tr })
            updatedState = state.apply(tr)
          }

          if (!lineNodeAt.next) {
            insertNewLineAtNextBlock({ state: updatedState, tr })
            updatedState = state.apply(tr)
          }

          tr.setSelection(TextSelection.near(tr.doc.resolve(tr.selection.$to.after(1))))

          dispatch(tr.scrollIntoView())
        }

        return true
      },
      unsetHorizontalRule(state, dispatch, view) {
        if (!editor.nodeIsSelected(nodeType)) return false

        return deleteSelectedNode(nodeType)(state, dispatch, view)
      },
      toggleHorzontalRule(state, dispatch, view) {
        if (editor.nodeIsSelected(nodeType)) {
          return this.unsetHorizontalRule(state, dispatch, view)
        }

        return this.setHorizontalRule(state, dispatch, view)
      },
    }
  },
  utils({ editor, nodeType }) {
    return {
      horizontalRuleIsSelected({ selection } = {}) {
        const editorSelection = selection ?? editor.state.selection

        return isSelectedNode({ nodeOrType: nodeType, selection: editorSelection })
      },
    }
  },
})
