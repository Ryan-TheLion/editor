import { selectParentNode } from 'prosemirror-commands'
import { DOMOutputSpec, Node } from 'prosemirror-model'
import { Command, NodeSelection, Plugin, PluginKey } from 'prosemirror-state'

import { ExtendConfigMap, ProsemirrorKeyboard } from '../../../typing'
import {
  deleteSelectedNode,
  getImageDimensionFromFile,
  getImageDimensionFromSrc,
  imageAspectRatio,
  ImageDimension,
  insertNewLineAtNextBlock,
  isFile,
  isNodeSelection,
  needsNewLine,
} from '../../utils'
import { AsyncPlaceholder } from '../async-placeholder'
import { BlockAlign, BlockAlignment } from '../block-align'
import { CODE_BLOCK_NAME } from '../code-block'
import { Figure, FIGURE_NAME } from '../figure'
import { BLOCK_LINK_NAME } from '../link'
import { ImageView } from './image-view'
import {
  CreateImageAttrsParam,
  CreatePlaceholderBaseParams,
  ImageAttributeSpecs,
  ImageAttrs,
  ImageOptions,
  ImageUtils,
  INLINE_IMAGE_NAME,
  InlineImage,
} from './inline-image'

type UploadBlockImage = ({
  source,
  align,
}: {
  source: File | string
  align: BlockAlignment
}) => (...args: Parameters<Command>) => Promise<boolean>

export interface BlockImageCommands {
  /** `BlockImage` 노드 삽입 */
  insertBlockImage: (
    payload: CreateImageAttrsParam & {
      align: BlockAlignment
      caption?: string
      pos?: number
    },
  ) => Command
  /** `BlockImage` 노드 삭제 */
  deleteBlockImage: Command
  /**
   * - 이미지 attr(속성) 을 update
   * - `keepAspectRatio` : width 나 height 만 제공한 경우 , 이미지 비율에 맞는 값을 자동으로 계산해서 적용할지 유무
   */
  updateImage: (attrs: Partial<ImageAttrs>, opt?: { keepAspectRatio?: boolean }) => Command
  /** `options.uploadImage` 를 활용하여 이미지 업로드 후 반환하는 속성(src, alt, title)을 바탕으로 `BlockImage` 노드를 삽입 */
  uploadImage: UploadBlockImage
  /** `InlineImage` 노드를 `BlockImage` 노드로 변환 */
  convertInlineImageToBlockImage: ({
    align,
    caption,
  }: {
    align: BlockAlignment
    caption?: string
  }) => Command
  /** `BlockImage` 의 container(`figure`)에 align 속성을 적용 */
  setAlign: (align: BlockAlignment) => Command
}

type BlockImageShortcutKeys =
  | ProsemirrorKeyboard['Enter']
  | ProsemirrorKeyboard['Backspace']
  | ProsemirrorKeyboard['Delete']

export type BlockImageShortcut = Record<BlockImageShortcutKeys, Command>

export interface BlockImageUtils extends ImageUtils {
  /** 현재 화면 크기에 대해 이미지 비율을 유지한 크기(width, height)를 반환 */
  getAdjustedDimension: ({
    dom,
    align,
  }: {
    dom: HTMLImageElement
    align: BlockAlignment
  }) => ImageDimension
}

export interface BlockImageOptions extends Omit<ImageOptions, 'createPlaceholder'> {
  /** upload 커맨드에서 업로드를 수행하는 (비동기) 작업 동안 표시할 placehodler 요소를 만드는 함수 */
  createPlaceholder?: ({
    dimension,
    blockAlign,
  }: CreatePlaceholderBaseParams & { blockAlign: BlockAlignment }) => HTMLElement
}

export const BLOCK_IMAGE_NAME = 'block_image' as const

/**
 * block image node extension
 *
 * ```ts
 * type BlockAlign = 'left' | 'center' | 'right' | 'full'
 * ```
 *
 * - `InlineImage` 노드의 확장
 * - `(spec) group: 'block'`
 *
 * **shortcut**
 * - `Enter`
 *   - `BlockImage`노드가 선택된 상태에서 Enter 키 입력시 선택된 상태 유지
 * - `Backspace`, `Delete`
 *   - `BlockImage`노드가 선택된 상태에서 Backspace, Delete 키 입력시 블럭 이미지(Figure 포함) 단위 노드 삭제
 *
 * **plugins**
 *
 * - dragstart 이벤트 핸들러
 * - `BlockImage` 노드의 nodeView
 */
export const BlockImage = InlineImage.extendAs<
  ExtendConfigMap<
    typeof InlineImage,
    {
      name: typeof BLOCK_IMAGE_NAME
      commands: BlockImageCommands
      shortcut: BlockImageShortcut
      utils: BlockImageUtils
    }
  >,
  BlockImageOptions
>({
  name: BLOCK_IMAGE_NAME,
  spec() {
    const baseSpec = this.spec
    const { getImageAttrsFromDOM } = this.utils

    return {
      ...baseSpec,
      group: 'block',
      inline: false,
      attrs: (() => {
        return {
          ...(baseSpec.attrs as ImageAttributeSpecs),
        } satisfies ImageAttributeSpecs
      })(),
      parseDOM: [
        {
          tag: 'img[src]',
          context: `${BLOCK_LINK_NAME}/`,
          consuming: false,
          getAttrs(dom) {
            return getImageAttrsFromDOM(dom)
          },
        },
        {
          tag: 'img[src]',
          context: `${FIGURE_NAME}/`,
          consuming: false,
          getAttrs(dom) {
            return getImageAttrsFromDOM(dom)
          },
        },
      ],
      toDOM(node, attributes) {
        return baseSpec.toDOM!(node, attributes)
      },
    }
  },
  commands() {
    const editor = this.editor
    const commands = this.commands
    const nodeType = this.nodeType
    const options = this.options
    const utils = this.utils

    return {
      insertBlockImage({ align, caption, pos, ...attrs }) {
        return (state, dispatch, view) => {
          if (isNodeSelection(state.selection)) return false

          const { $from } = editor.view.state.selection

          const node = $from.node()

          if (node.type.name === CODE_BLOCK_NAME) return false

          const nodeAttrs = {
            ...utils.createAttrs(attrs),
            ...(align === 'full' && { width: 'full' }),
            by: 'command',
          }

          const image = nodeType.create(nodeAttrs)

          return Figure.commands.insertFigure({
            align,
            childNode: image,
            caption,
            pos,
          })(state, dispatch, view)
        }
      },
      deleteBlockImage(state, dispatch) {
        if (!isNodeSelection(state.selection)) return false

        const { $from, node } = state.selection

        if (node.type.name !== nodeType.name) return false

        if (dispatch) {
          const $pos = state.doc.resolve($from.pos)

          const from = $pos.before(1)
          const to = from + $pos.node().nodeSize

          const tr = state.tr

          tr.delete(from, to)

          dispatch(tr)
        }

        return true
      },
      updateImage(attrs, { keepAspectRatio = true } = {}) {
        return (state, dispatch, view) => {
          return commands.updateImage(attrs, {
            allowNodeTypeName: BLOCK_IMAGE_NAME,
            keepAspectRatio,
          })(state, dispatch, view)
        }
      },
      uploadImage({ source, align }) {
        return async (state, dispatch, view) => {
          if (!options?.uploadImage) return false
          if (isNodeSelection(state.selection)) return false

          const isFetching = AsyncPlaceholder.utils.hasWidgetAtPos()
          if (isFetching) return false

          const sourceIsFile = isFile(source)

          let tr = state.tr.deleteSelection()
          const initialPos = tr.selection.$from.pos

          const dimension = sourceIsFile
            ? await getImageDimensionFromFile(source)
            : await getImageDimensionFromSrc(source)

          const { id: placeholderWidgetId, tr: createPlaceholderTr } =
            AsyncPlaceholder.utils.setAsyncPlaceholderAction(tr, {
              type: options.createPlaceholder ? 'add' : 'tracking',
              pos: initialPos,
              ...(options.createPlaceholder && {
                widget: options.createPlaceholder({ dimension, blockAlign: align }),
              }),
            })

          tr = createPlaceholderTr

          if (needsNewLine({ state: state.apply(tr) })) {
            insertNewLineAtNextBlock({ tr, state: state.apply(tr), focusLine: true })
          }

          dispatch?.(tr)

          const { src, alt, title } = await options.uploadImage({
            source,
            isFile,
          })

          const figure = Figure.utils.createFigureNode({
            childNode: nodeType.create(
              utils.createAttrs({
                src,
                alt,
                title,
                originalWidth: dimension.width,
                originalHeight: dimension.height,
                by: 'command',
              }),
            ),
            caption: alt,
            align,
          })

          const insertPos = AsyncPlaceholder.utils.findAsyncPlaceholder({
            state: editor.state,
            id: placeholderWidgetId,
          })!.from!

          const { tr: removePlaceholderTr } = AsyncPlaceholder.utils.setAsyncPlaceholderAction(
            editor.state.tr,
            { type: 'remove', id: placeholderWidgetId },
          )

          dispatch?.(removePlaceholderTr.insert(insertPos, figure))

          return true
        }
      },
      convertInlineImageToBlockImage({ align, caption }) {
        return (state, dispatch, view) => {
          if (!isNodeSelection(state.selection)) return false

          const { node } = state.selection

          if (node.type.name !== INLINE_IMAGE_NAME) return false

          return Figure.commands.insertFigure({
            align,
            childNode: nodeType.create({
              ...node.attrs,
              ...(align === 'full' && { width: 'full' }),
            }),
            caption,
            ...(node.marks.length && { marks: node.marks }),
          })(state, dispatch, view)
        }
      },
      setAlign(align) {
        return (state, dispatch, view) => {
          if (!isNodeSelection(state.selection)) return false

          return BlockAlign.commands.setBlockAlign(align)(state, dispatch, view)
        }
      },
    }
  },
  shortcut() {
    const blockImageNodeType = this.nodeType

    return {
      Enter: (state) => {
        const imageNodeSelected =
          isNodeSelection(state.selection) && state.selection.node.type.name === BLOCK_IMAGE_NAME

        if (!imageNodeSelected) return false

        return true
      },
      Backspace: deleteSelectedNode(blockImageNodeType),
      Delete: deleteSelectedNode(blockImageNodeType),
    }
  },
  utils() {
    const editor = this.editor
    const utils = this.utils

    return {
      ...utils,
      getAdjustedDimension({ dom, align }) {
        const maxWidth = editor.view.dom.clientWidth
        const ratio = imageAspectRatio(
          {
            width: dom.naturalWidth ?? dom.width,
            height: dom.naturalHeight ?? dom.height,
          },
          ({ simplifiedWidthRatio, simplifiedHeightRatio }) =>
            simplifiedWidthRatio / simplifiedHeightRatio,
        )!

        if (align === 'full') {
          return {
            width: Math.round(maxWidth),
            height: Math.round(maxWidth / ratio),
          }
        }

        const resizedWidth = Math.round(maxWidth * 0.75)

        const adjustedWidth = Math.min(dom.naturalWidth, resizedWidth)
        const adjustedHeight =
          adjustedWidth === dom.naturalWidth
            ? Math.round(dom.naturalWidth / ratio)
            : Math.round(adjustedWidth / ratio)

        return {
          width: adjustedWidth,
          height: adjustedHeight,
        }
      },
    }
  },
  plugins() {
    const options = this.options

    const key = new PluginKey('block-image')

    const plugin = new Plugin({
      key,
      props: {
        handleDOMEvents: {
          dragstart(view, event) {
            const target = event.target as HTMLElement

            if (target.tagName !== 'IMG') return true
            if (target.parentElement?.tagName !== 'FIGURE') return true

            const pos = view.posAtDOM(target, 0)
            const $pos = view.state.doc.resolve(pos)

            const nodeSelection = NodeSelection.create(view.state.doc, $pos.before())

            view.dispatch(view.state.tr.setSelection(nodeSelection))
            selectParentNode(view.state, view.dispatch, view)

            return false
          },
        },
        nodeViews: {
          [BLOCK_IMAGE_NAME]: (node, view, getPos, decorations, innerDecorations) => {
            return new ImageView({
              node,
              view,
              getPos,
              decorations,
              innerDecorations,
              allowedNodeTypeName: BLOCK_IMAGE_NAME,
              fallbackURL: options.fallbackURL,
              toDOM: getBlockImageToDom(),
              onClick(dom) {
                ImageView.openPopup(dom, { fallbackURL: options.fallbackURL })
              },
            })
          },
        },
      },
    })

    return [plugin]
  },
})

function getBlockImageToDom(): (node: Node) => DOMOutputSpec {
  return BlockImage.nodeType.spec.toDOM as (node: Node) => DOMOutputSpec
}
