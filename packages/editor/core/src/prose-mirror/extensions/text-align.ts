import { Attrs } from 'prosemirror-model'
import { Command, Transaction } from 'prosemirror-state'

import { MergeConfigMap } from '../../typing'
import { hasAttr } from '../utils'
import { Extension, NodeExtension } from './core'
import { HEADING_NAME } from './heading'
import { PARAGRAPH_NAME } from './paragraph'

type MergeTextAlignAttrs<ExtraAttrs extends Attrs = {}> = TextAlignAttrs & ExtraAttrs

export type TextAlignAttrs = {
  [TEXT_ALIGN_ATTRIBUTE_NAME]: TextAlignment
}

/** `TextAlign` alignment 타입(node textAlign 속성 값) */
export type TextAlignment = 'left' | 'center' | 'right'

export interface TextAlignCommand {
  /** 노드의 text align 속성을 `'left' | 'center' | 'right'` 중 하나로 설정 */
  setTextAlign: (alignment: TextAlignment) => Command
  /** 노드의 text align 속성을 해제 */
  unsetTextAlign: Command
  toggleTextAlign: (alignment: TextAlignment) => Command
}

export interface TextAlignUtils {
  /**
   * textAlign 속성 값을 포함한 attrs 생성을 도와 주는 유틸 함수
   * @example
   * ```ts
   * TextAlign.utils.mergeAttribute({textAlign: 'center', ...rest})
   * // attrs { textAlign: 'center', ...rest}
   * ```
   */
  mergeAttribute: <ExtraAttrs extends Attrs = {}>(
    attrs: MergeTextAlignAttrs<ExtraAttrs>,
  ) => Omit<ExtraAttrs, keyof TextAlignAttrs> & TextAlignAttrs
  /** 현재 selection 에 text align 속성이 있고 값이 alignment인 노드가 있는지 유무 */
  isActive: (alignment: TextAlignment) => boolean
}

export interface TextAlignOptions {
  /** dynamic attrs로 text align 스타일을 적용하고 싶은 node extension 이름의 배열 */
  targetNodes?: string[] | readonly string[]
}

export const DEFAULT_TEXTALIGN_TARGET_NODES: ReadonlyArray<
  typeof HEADING_NAME | typeof PARAGRAPH_NAME
> = [HEADING_NAME, PARAGRAPH_NAME]

export const DEFALUT_TEXT_ALIGNMENT: TextAlignment = 'left' as const

export const TEXT_ALIGNMENTS: ReadonlyArray<TextAlignment> = ['left', 'center', 'right']

export const TEXT_ALIGN_NAME = 'text_align' as const

export const TEXT_ALIGN_ATTRIBUTE_NAME = 'textAlign' as const

/**
 * 노드에 dynamic attrs 를 통해 text align 스타일을 적용하는 extension
 *
 * ```ts
 * type TextAlignment = 'left' | 'center' | 'right'
 * ```
 *
 * - `targetNodes` 옵션을 설정하지 않을 경우 기본 값 `[HEADING_NAME, PARAGRAPH_NAME]` 이 설정되서 `Heading` 노드와 `Paragraph` 노드에 적용 됨
 * - 인라인 스타일 (ex.`{text-align: 'left'}`) 로 적용 됨
 */
export const TextAlign = Extension.create<
  MergeConfigMap<{
    name: typeof TEXT_ALIGN_NAME
    commands: TextAlignCommand
    utils: TextAlignUtils
  }>,
  TextAlignOptions
>({
  name: TEXT_ALIGN_NAME,
  options: {
    targetNodes: DEFAULT_TEXTALIGN_TARGET_NODES,
  },
  attributeSpec({ options }) {
    return [
      NodeExtension.createDynamicAttribute({
        extensions: options.targetNodes
          ? options?.targetNodes ?? DEFAULT_TEXTALIGN_TARGET_NODES
          : DEFAULT_TEXTALIGN_TARGET_NODES,
        attributes: {
          [TEXT_ALIGN_ATTRIBUTE_NAME]: {
            default: DEFALUT_TEXT_ALIGNMENT,
            validate: (value) => {
              if (TEXT_ALIGNMENTS.includes(value)) return

              throw new Error(`${value}는 유효한 textAlign 속성 값이 아닙니다`)
            },
            parseDOM(dom) {
              return dom.style.textAlign || DEFALUT_TEXT_ALIGNMENT
            },
            toDOM(node) {
              if (
                !hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME) ||
                node.attrs[TEXT_ALIGN_ATTRIBUTE_NAME] === DEFALUT_TEXT_ALIGNMENT
              )
                return null

              return { style: `text-align: ${node.attrs.textAlign}` }
            },
          },
        },
      }),
    ]
  },
  commands({ utils }) {
    return {
      setTextAlign(alignment) {
        return (state, dispatch) => {
          const { $from, $to, empty } = state.selection

          if (empty) {
            const node = $from.node($from.depth)

            if (!hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME)) {
              return false
            }

            if (dispatch) {
              dispatch(
                state.tr.setNodeAttribute(
                  $from.before($from.depth),
                  TEXT_ALIGN_ATTRIBUTE_NAME,
                  alignment,
                ),
              )
            }

            return true
          }

          let tr: Transaction | null = null

          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME)) {
              tr = tr
                ? tr.setNodeAttribute(pos, TEXT_ALIGN_ATTRIBUTE_NAME, alignment)
                : state.tr.setNodeAttribute(pos, TEXT_ALIGN_ATTRIBUTE_NAME, alignment)
            }
          })

          if (dispatch && !!tr) {
            dispatch(tr)
          }

          return !!tr
        }
      },
      unsetTextAlign(state, dispatch) {
        const { $from, $to, empty } = state.selection

        if (empty) {
          const node = $from.node($from.depth)

          if (!hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME)) {
            return false
          }

          if (dispatch) {
            dispatch(
              state.tr.setNodeAttribute(
                $from.before($from.depth),
                TEXT_ALIGN_ATTRIBUTE_NAME,
                DEFALUT_TEXT_ALIGNMENT,
              ),
            )
          }

          return true
        }

        let tr: Transaction | null = null

        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME)) {
            tr = tr
              ? tr.setNodeAttribute(pos, TEXT_ALIGN_ATTRIBUTE_NAME, DEFALUT_TEXT_ALIGNMENT)
              : state.tr.setNodeAttribute(pos, TEXT_ALIGN_ATTRIBUTE_NAME, DEFALUT_TEXT_ALIGNMENT)
          }
        })

        if (dispatch && !!tr) {
          dispatch(tr)
        }

        return !!tr
      },
      toggleTextAlign(alignment) {
        return (state, dispatch, view) => {
          if (utils.isActive(alignment)) return this.unsetTextAlign(state, dispatch, view)

          return this.setTextAlign(alignment)(state, dispatch, view)
        }
      },
    }
  },
  utils({ editor }) {
    return {
      mergeAttribute({ textAlign, ...attrs }) {
        return {
          textAlign,
          ...attrs,
        }
      },
      isActive(alignment) {
        const { $from, $to, empty } = editor.state.selection

        if (empty) {
          const node = $from.node($from.depth)

          return (
            hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME) &&
            node.attrs[TEXT_ALIGN_ATTRIBUTE_NAME] === alignment
          )
        }

        let found = false

        editor.state.doc.nodesBetween($from.pos, $to.pos, (node) => {
          if (found) return false

          if (
            hasAttr(node.attrs, TEXT_ALIGN_ATTRIBUTE_NAME) &&
            node.attrs[TEXT_ALIGN_ATTRIBUTE_NAME] === alignment
          ) {
            found = true

            return false
          }

          return !found
        })

        return found
      },
    }
  },
})
