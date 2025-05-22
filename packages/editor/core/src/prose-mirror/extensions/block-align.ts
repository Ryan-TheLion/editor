import { kebabCase } from 'lodash-es'
import { Attrs, Node } from 'prosemirror-model'
import { Command, Selection } from 'prosemirror-state'

import { MergeConfigMap } from '../../typing'
import {
  adjustedDimension,
  hasAttr,
  imageAspectRatio,
  ImageDimension,
  matchParent,
  setNodeAttributes,
} from '../utils'
import { Extension, NodeExtension } from './core'
import { FIGURE_NAME } from './figure'
import { BLOCK_IMAGE_NAME } from './image'

type MergeBlockAlignAttrs<ExtraAttrs extends Attrs = {}> = BlockAlignAttrs & ExtraAttrs

export type BlockAlignAttrs = {
  [BLOCK_ALIGN_ATTRIBUTE_NAME]: BlockAlignment
}

/**
 * block align 속성 값
 *
 * - `left` : 좌측 정렬
 * - `center` : 가운데 정렬
 * - `right` : 우측 정렬
 * - `full` : 부모 width(100%)에 맞춤
 */
export type BlockAlignment = 'left' | 'center' | 'right' | 'full'

export interface BlockAlignCommands {
  /** node 부모 노드 중 blockAlign 속성을 가지는 노드를 찾고, 있을 경우 blockAlign 속성 값을 설정하려고 하는 align으로 설정 */
  setBlockAlign: (align: BlockAlignment) => Command
}

export interface BlockAlignUtils {
  /**
   * blockAlign 속성 값을 포함한 attrs 생성을 도와 주는 유틸 함수
   * @example
   * ```ts
   * BlockAlign.utils.mergeAttribute({blockAlign: 'center', ...rest})
   * // attrs { blockAlign: 'center', ...rest}
   * ```
   */
  mergeAttribute: <ExtraAttrs extends Attrs = {}>(
    attrs: MergeBlockAlignAttrs<ExtraAttrs>,
  ) => Omit<ExtraAttrs, keyof BlockAlignAttrs> & BlockAlignAttrs
  /** placeholder 요소 생성을 도와주는 유틸 함수 */
  createPlaceholder: ({
    asFigure,
    classNames,
    dimension,
    align,
    altText,
    keepRatio,
  }: {
    asFigure?: boolean
    classNames?: {
      container?: string[]
      placeholder?: string[]
    }
    align: BlockAlignment
    dimension?: ImageDimension
    altText?: string
    keepRatio?: boolean
  }) => HTMLElement
  /**
   * 다음 모든 조건을 만족하는 노드인지 검사
   * 1. block 노드
   * 2. blockAlign 속성을 가지고 있음
   * 3. blockAlign 속성이 유효한 alignment 값 ('left' | 'center' | 'right' | 'full')
   */
  isBlockAlignNode: (node: Node) => boolean
  /** 현재 selection에서 node가 유효한 blockAlign 속성을 가지는 노드를 부모로 가지는 지 유무 */
  isBlockAlignChlid: ({ node, selection }: { node: Node; selection: Selection }) => boolean
}

export interface BlockAlignOptions {
  /**
   * - blockAlign attr(dynamic attr) 적용을 통해 관리하고자 하는 Node의 타입 이름의 배열
   * - 기본값 `[FIGURE_NAME]`
   */
  targetNodes?: string[] | readonly string[]
}

export const BLOCK_ALIGN_CLASSNAME = {
  CONTAINER: 'block-align-container',
  PLACEHOLDER: 'block-align-placeholder',
} as const

export const DEFAULT_BLOCKALIGN_TARGET_NODES: ReadonlyArray<typeof FIGURE_NAME> = [FIGURE_NAME]

export const DEFAULT_BLOCK_ALIGN: BlockAlignment = 'center' as const

export const BLOCK_ALIGNMENTS: ReadonlyArray<BlockAlignment> = ['left', 'center', 'right', 'full']

export const BLOCK_ALIGN_ATTRIBUTE_NAME = 'blockAlign' as const

export const BLOCK_ALIGN_NAME = 'block_align' as const

/**
 * block align extension
 *
 * block align 정렬을 위한 extension
 * (`node.attrs['blockAlign']` 적용)
 *
 * ```ts
 * type BlockAlignment = 'left' | 'center' | 'right' | 'full'
 * ```
 *
 * - 기본 blockAlign 속성 값 `center`
 * - 적용된 노드의 dom 에 `block-align-container` 클래스가 적용되고, `data-block-align` (dataset) 에도 관련 align 문자 값이 적용 됨
 *
 */
export const BlockAlign = Extension.create<
  MergeConfigMap<{
    name: typeof BLOCK_ALIGN_NAME
    commands: BlockAlignCommands
    utils: BlockAlignUtils
  }>,
  BlockAlignOptions
>({
  name: BLOCK_ALIGN_NAME,
  options: {
    targetNodes: DEFAULT_BLOCKALIGN_TARGET_NODES,
  },
  attributeSpec({ options }) {
    return [
      NodeExtension.createDynamicAttribute({
        extensions: options.targetNodes!,
        attributes: {
          [BLOCK_ALIGN_ATTRIBUTE_NAME]: {
            default: DEFAULT_BLOCK_ALIGN,
            validate: (value) => {
              if (BLOCK_ALIGNMENTS.includes(value)) return

              throw new Error(`${value}는 유효한 blockAlign 속성 값이 아닙니다`)
            },
            parseDOM(dom) {
              return dom.dataset[BLOCK_ALIGN_ATTRIBUTE_NAME] || DEFAULT_BLOCK_ALIGN
            },
            toDOM(node) {
              return {
                class: 'block-align-container',
                [`data-${kebabCase(BLOCK_ALIGN_ATTRIBUTE_NAME)}`]:
                  node.attrs[BLOCK_ALIGN_ATTRIBUTE_NAME],
              }
            },
          },
        },
      }),
    ]
  },
  commands() {
    return {
      setBlockAlign(align) {
        return (state, dispatch, view) => {
          const { $from } = state.selection

          const blockAlignContainer = matchParent($from, (node) =>
            hasAttr(node.attrs, BLOCK_ALIGN_ATTRIBUTE_NAME),
          )

          if (!blockAlignContainer) return false
          if (blockAlignContainer.node.attrs[BLOCK_ALIGN_ATTRIBUTE_NAME] === align) return false

          const tr = state.tr

          const can = setNodeAttributes(
            blockAlignContainer.node,
            { [BLOCK_ALIGN_ATTRIBUTE_NAME]: align },
            { tr },
          )

          const firstChild = blockAlignContainer.node.firstChild

          if (firstChild?.type.name === BLOCK_IMAGE_NAME && align === 'full') {
            setNodeAttributes(blockAlignContainer.node.firstChild!, { width: 'full' }, { tr })
          }

          if (can && dispatch) {
            dispatch(tr)
          }

          return can
        }
      },
    }
  },
  utils({ editor }) {
    return {
      mergeAttribute({ blockAlign, ...attrs }) {
        return {
          blockAlign,
          ...attrs,
        }
      },
      createPlaceholder({ asFigure = true, classNames, dimension, align, altText, keepRatio }) {
        const className = {
          container: [
            ...(classNames?.container?.length
              ? classNames.container.filter((cls) => cls !== BLOCK_ALIGN_CLASSNAME.CONTAINER)
              : []),
            BLOCK_ALIGN_CLASSNAME.CONTAINER,
          ]
            .filter((cls) => !!cls)
            .join(' '),
          placeholder: [
            ...(classNames?.placeholder?.length ? classNames.placeholder : ['skeleton']),
          ]
            .filter((cls) => !!cls)
            .join(' '),
        } satisfies Record<keyof Required<typeof classNames>, string>

        const container = document.createElement(asFigure ? 'figure' : 'div')
        container.className = className.container
        container.dataset['blockAlign'] = (align ?? DEFAULT_BLOCK_ALIGN) as BlockAlignment

        const placeholder = document.createElement('div')
        placeholder.className = className.placeholder

        placeholder.style.width = (({
          align,
          dimension,
        }: {
          align?: BlockAlignment
          dimension?: ImageDimension
        }) => {
          if (align === 'full') return '100%'
          if (dimension) return `${dimension.width}px`

          return ''
        })({ align, dimension })

        const alt = document.createElement(asFigure ? 'figcaption' : 'div')
        alt.textContent = altText || '로딩 중 입니다'

        if (keepRatio && dimension) {
          placeholder.style.aspectRatio = imageAspectRatio({
            width: dimension.width,
            height: dimension.height,
          })!

          container.append(placeholder, alt)

          return container
        }

        const parentWidth = Number(
          (placeholder.parentElement ?? editor.view.dom).clientWidth.toFixed(0),
        )

        const width = dimension
          ? align === 'full'
            ? parentWidth
            : Math.min(dimension.width, parentWidth)
          : null
        const height = dimension
          ? adjustedDimension(
              {
                originalWidth: dimension.width,
                originalHeight: dimension.height,
              },
              {
                target: 'height',
                resizedWidth: align === 'full' ? parentWidth : width!,
              },
            )
          : null

        if (width) {
          placeholder.style.width = `${width}px`
        }
        if (!placeholder.style.width) placeholder.style.removeProperty('width')

        if (height) {
          placeholder.style.height = `${height}px`
        }
        if (!placeholder.style.height) placeholder.style.removeProperty('height')

        container.append(placeholder, alt)

        return container
      },
      isBlockAlignNode(node) {
        return (
          node.isBlock &&
          hasAttr(node.attrs, BLOCK_ALIGN_ATTRIBUTE_NAME) &&
          BLOCK_ALIGNMENTS.includes(node.attrs[BLOCK_ALIGN_ATTRIBUTE_NAME])
        )
      },
      isBlockAlignChlid({ node, selection }) {
        const { $from } = selection

        const blockAlignNode = matchParent($from, (parent) => this.isBlockAlignNode(parent))

        if (!blockAlignNode) return false

        let isMatchedChild = false

        blockAlignNode.node.descendants((child) => {
          if (isMatchedChild) return false

          if (child.eq(node)) {
            isMatchedChild = true
          }
        })

        return isMatchedChild
      },
    }
  },
})
