import { setBlockType } from 'prosemirror-commands'
import { Node } from 'prosemirror-model'
import { Command } from 'prosemirror-state'

import { MergeConfigMap } from '../../typing'
import { NodeExtension } from './core'

export interface ParagraphCommands {
  /** `Paragraph` 노드 블럭으로 설정 */
  setParagraph: Command
}

export interface ParagraphUtils {
  /** `Paragraph` 노드이면서 콘텐츠가 없는지 유무 */
  isEmptyParagraph: (node: Node) => boolean
  /** 해당 node가 `Paragraph` 노드인지 유무 */
  isParagraphNode: (node: Node) => boolean
}

export const PARAGRAPH_NAME = 'paragraph' as const

/**
 * paragraph(`<p>`) node extension
 */
export const Paragraph = NodeExtension.create<
  MergeConfigMap<{
    name: typeof PARAGRAPH_NAME
    commands: ParagraphCommands
    utils: ParagraphUtils
  }>
>({
  name: PARAGRAPH_NAME,
  priority: Infinity,
  extendProseMirrorBaseNodeSpec: {
    key: 'paragraph',
    spec({ baseNodeSpec }) {
      return {
        ...baseNodeSpec,
        toDOM(node, attributes) {
          return ['p', attributes, 0]
        },
      }
    },
  },
  commands({ nodeType }) {
    return {
      setParagraph(state, dispatch, view) {
        const setParagraphBlock = setBlockType(nodeType)

        const canSetParagraphBlock = setParagraphBlock(state)

        if (!canSetParagraphBlock) return false

        if (dispatch) {
          setParagraphBlock(state, dispatch, view)
        }

        return true
      },
    }
  },
  utils({ nodeType }) {
    return {
      isEmptyParagraph(node) {
        if (node.type.name !== nodeType.name) return false

        return !node.content.childCount
      },
      isParagraphNode(node) {
        return node.type.name === nodeType.name
      },
    }
  },
})
