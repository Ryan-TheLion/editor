import { Mark, Node } from 'prosemirror-model'
import { Command } from 'prosemirror-state'

import { MergeConfigMap } from '../../../typing'
import { BlockAlign, BlockAlignment } from '../block-align'
import { NodeExtension } from '../core'
import { FigCaption } from './fig-caption'

/**
 * figure 노드 attrs
 *
 * ```ts
 * {
 *   contentAlign
 * }
 * ```
 */
export interface FigureAttrs {
  contentAlign: BlockAlignment | null
}

export interface FigureCommands {
  /**
   * figure 노드 삽입
   * - pos를 제공할 경우 해당 pos 에 삽입
   */
  insertFigure: ({
    childNode,
    caption,
    align,
    marks,
    pos,
  }: {
    childNode: Node
    caption?: Node[] | string
    align: BlockAlignment
    marks?: readonly Mark[] | Mark[]
    pos?: number
  }) => Command
}

export interface FigureUtils {
  /**
   * figure 노드 생성
   * - `childNode`
   *   - figure 자식 노드 (block 노드)
   * - `caption`
   *   - caption 문자열
   *   - `FigCaption` 노드의 텍스트로 설정 됨
   * - `align`
   *   - `childNode` 의 align 값 설정
   * - `marks`
   *   - `childNode` 에 적용하고 싶은 mark 배열
   */
  createFigureNode: ({
    childNode,
    caption,
    align,
    marks,
  }: {
    childNode: Node
    caption?: string
    align: BlockAlignment
    marks?: Mark[]
  }) => Node
}

export const FIGURE_NAME = 'figure' as const

/**
 * figure(`<figure>`) node extension
 * - figure block(group: 'block' 인 노드) figcaption 의 구조
 */
export const Figure = NodeExtension.create<
  MergeConfigMap<{
    name: typeof FIGURE_NAME
    commands: FigureCommands
    utils: FigureUtils
  }>
>({
  name: FIGURE_NAME,
  nodeSpec() {
    return {
      group: 'block',
      content: 'block figcaption',
      isolating: true,
      parseDOM: [
        {
          tag: 'figure',
        },
      ],
      toDOM(node, attributes) {
        return [
          'figure',
          {
            ...attributes,
          },
          0,
        ]
      },
    }
  },
  commands({ nodeType }) {
    return {
      insertFigure({ childNode, caption, align, marks, pos }) {
        return (state, dispatch, view) => {
          if (!childNode.isBlock) return false

          const captionNode = ((caption?: string | Node[]) => {
            if (!caption) return FigCaption.nodeType.create({})

            if (typeof caption === 'string') {
              return FigCaption.nodeType.create({}, state.schema.text(caption))
            }

            return FigCaption.nodeType.create({}, caption)
          })(caption)

          const figureNode = nodeType.create(
            BlockAlign.utils.mergeAttribute({ blockAlign: align }),
            [childNode.type.create(childNode.attrs, childNode.content, marks), captionNode],
          )

          if (dispatch) {
            const tr = state.tr

            typeof pos === 'number'
              ? tr.insert(pos, figureNode)
              : tr.replaceSelectionWith(figureNode)

            dispatch(tr)
          }

          return true
        }
      },
    }
  },
  utils({ editor, nodeType }) {
    return {
      createFigureNode({ childNode, caption, align, marks }) {
        const captionNode = ((caption?: string) => {
          if (!caption) return FigCaption.nodeType.create({})

          return FigCaption.nodeType.create({}, editor.state.schema.text(caption))
        })(caption)

        const figureNode = nodeType.create(BlockAlign.utils.mergeAttribute({ blockAlign: align }), [
          childNode.type.create(childNode.attrs, childNode.content, marks),
          captionNode,
        ])

        return figureNode
      },
    }
  },
})
