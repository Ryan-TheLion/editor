import { Command, Plugin, PluginKey } from 'prosemirror-state'

import { MergeConfigMap, PositiveSize, TypedAttributeSpecs } from '../../../typing'
import {
  adjustedDimension,
  getImageDimensionFromFile,
  getImageDimensionFromSrc,
  ImageDimension,
  isFile,
  isNodeSelection,
} from '../../utils'
import { AsyncPlaceholder } from '../async-placeholder'
import { NodeExtension } from '../core'
import { BLOCK_IMAGE_NAME } from './block-image'
import { ImageView } from './image-view'

export type ImageSize<Size extends number | string> = PositiveSize<Size>

/**
 * 이미지 노드 attrs
 *
 * ```ts
 * {
 *   src,
 *   alt,
 *   title,
 *   width,
 *   height,
 *   originalWidth,
 *   originalHeight,
 *   by
 * }
 * ```
 */
export interface ImageAttrs {
  /** 이미지 주소 */
  src: string
  /** 이미지 대체 텍스트 */
  alt: string | null
  /** 이미지 title */
  title: string | null
  /**
   * - 적용하고 싶은 이미지의 width
   * - `full` 로 설정할 경우 부모 요소에 맞춤 (`100%`)
   */
  width: 'full' | number | null
  /** 적용하고 싶은 이미지의 height */
  height: number | null
  /**
   * - 이미지 원본 width
   * - aspectRatio 를 통해 이미지 비율을 유지하는 데 활용
   */
  originalWidth: number | null
  /**
   * - 이미지 원본 height
   * - aspectRatio 를 통해 이미지 비율을 유지하는 데 활용
   */
  originalHeight: number | null
  /**
   * - 이미지를 삽입하는 케이스
   *   - `command` 일 경우 이미지 삽입 중 에러가 발생 할 경우 삽입 취소 (for edit mode)
   *   - `natural` 일 경우 이미지 에러가 발생 할 경우 fallback url 이 있을 경우 해당 이미지 주소로 대체 (for view mode)
   */
  by: 'command' | 'natural'
}

export type CreateImageAttrsParam = Pick<ImageAttrs, 'src'> & Partial<ImageAttrs>

/** for image `node spec` attrs */
export type ImageAttributeSpecs = TypedAttributeSpecs<ImageAttrs>

export interface UploadedImageAttrs {
  src: string
  alt?: string
  title?: string
}

export interface CreatePlaceholderBaseParams {
  dimension: ImageDimension
}

type UploadInlineImage = ({
  source,
}: {
  source: File | string
}) => (...args: Parameters<Command>) => Promise<boolean>

export type ImageUploadOption = ({
  source,
  isFile,
}: {
  source: File | string
  isFile: (source: unknown) => source is File
}) => Promise<UploadedImageAttrs>

export interface ImageOptions {
  /**
   * - viewer(editable = false) 모드일 때 이미지 로드에 실패했을 경우 표시할 대체 이미지의 주소
   * - `ImageView` 에서 활용
   */
  fallbackURL?: string
  /** upload 커맨드에서 업로드를 수행하는 (비동기) 작업 동안 표시할 placeholder 요소를 만드는 함수 */
  createPlaceholder?: ({ dimension }: CreatePlaceholderBaseParams) => HTMLElement
  /**
   * 1. 업로드 로직을 구현
   * 2. 업로드 로직 이후 이미지에 적용되야 하는 속성을 반환
   *
   * - `isFile`
   *   - source 를 File 타입으로 인식하게 해주는 타입가드 함수 (`source instanceof File`)
   *   - `if(isFile(source)) {...}` 일 때, if 내부에서 source는 File 타입으로 인식
   */
  uploadImage?: ImageUploadOption
}

export interface ImageCommands {
  /** `InlineImage` 노드 이미지 삽입 */
  insertInlineImage: ({
    attrs,
    pos,
  }: {
    attrs: Omit<CreateImageAttrsParam, 'by'>
    pos?: number
  }) => Command
  /** `InlineImage` 노드 이미지 삭제 */
  deleteInlineImage: Command
  /**
   * - 이미지 attr(속성) 을 update
   * - opt
   *   - `allowNodeTypeName`
   *     - 허용하는 노드 타입 이름 , 기본 값 `INLINE_IMAGE_NAME`
   *     - BlockImage 에서도 공용 함수로 재사용하기 위해 설정
   *   - `keepAspectRatio` : width 나 height 만 제공한 경우 , 이미지 비율에 맞는 값을 자동으로 계산해서 업데이트할지 유무
   */
  updateImage: (
    attrs: Partial<ImageAttrs>,
    opt?: { allowNodeTypeName?: string; keepAspectRatio?: boolean },
  ) => Command
  /** `options.uploadImage` 를 활용하여 이미지 업로드 후 반환하는 속성(src, alt, title)을 바탕으로 `InlineImage` 노드를 삽입 */
  uploadImage: UploadInlineImage
  /** `BlockImage` 노드를 `InlineImage` 노드로 변환하는 command */
  convertBlockImageToInlineImage: Command
}

export interface ImageUtils {
  /** dom 에서 이미지 노드의 attrs 를 추출하는 유틸 함수 */
  getImageAttrsFromDOM: (dom: HTMLElement) => ImageAttrs
  /** 이미지 attrs 생성을 도와주는 유틸 함수 */
  createAttrs: (attrs: CreateImageAttrsParam) => ImageAttrs
}

export const DEFAULT_IMAGE_OPTIONS: ImageOptions = {
  fallbackURL: `https://placehold.co/600x400?text=image+could+not+be+loaded`,
}

export const INLINE_IMAGE_NAME = 'inline_image' as const

/**
 * inline image node extension
 *
 * 이미지(inline, block) base node
 *
 * **plugins**
 *
 * - `InlineImage` 노드의 nodeView
 */
export const InlineImage = NodeExtension.create<
  MergeConfigMap<{
    name: typeof INLINE_IMAGE_NAME
    commands: ImageCommands
    utils: ImageUtils
  }>,
  ImageOptions
>({
  name: INLINE_IMAGE_NAME,
  options: DEFAULT_IMAGE_OPTIONS,
  extendProseMirrorBaseNodeSpec: {
    key: 'image',
    spec({ baseNodeSpec }) {
      return {
        ...baseNodeSpec,
        attrs: (() => {
          return {
            src: {
              validate: 'string',
            },
            alt: {
              default: null,
              validate: 'string|null',
            },
            title: {
              default: null,
              validate: 'string|null',
            },
            width: {
              default: null,
              validate(value) {
                if (typeof value === 'number') return
                if (value === 'full') return
                if (value === null) return

                throw new Error(`유효한 width 속성 값이 아닙니다`)
              },
            },
            originalWidth: {
              default: null,
              validate: 'number|null',
            },
            height: {
              default: null,
              validate: 'number|null',
            },
            originalHeight: {
              default: null,
              validate: 'number|null',
            },
            by: {
              default: 'natural',
              validate(value) {
                if ((['natural', 'command'] as ImageAttrs['by'][]).includes(value)) return

                throw new Error(`${value}는 유효한 by 속성 값이 아닙니다`)
              },
            },
          } satisfies ImageAttributeSpecs
        })(),
        parseDOM: [
          {
            tag: 'img[src]',
            consuming: false,
            getAttrs(dom) {
              const utils = InlineImage.utils as ImageUtils

              const attrs = utils.getImageAttrsFromDOM(dom)

              return attrs
            },
          },
        ],
        toDOM(node, attributes) {
          const { src, alt, title, width, originalWidth, height, originalHeight, by } =
            node.attrs as ImageAttrs

          const styleMap = []
          if (width) styleMap.push(`width: ${width === 'full' ? '100%' : width + 'px'}`)
          if (height) styleMap.push(`height: ${height}px`)

          return [
            'img',
            {
              src,
              alt,
              title,
              ['data-original-width']: originalWidth || null,
              ['data-original-height']: originalHeight || null,
              ...(by === 'command' && { ['data-by']: 'command' }),
              ...(styleMap.length && { style: styleMap.join('; ') }),
              ...attributes,
            },
          ]
        },
      }
    },
  },
  commands({ editor, nodeType, utils, options }) {
    return {
      insertInlineImage({ attrs, pos }) {
        return (state, dispacth, view) => {
          if (!attrs.src) return false
          if (isNodeSelection(state.selection)) return false

          if (dispacth) {
            const image = nodeType.create({
              ...attrs,
              by: 'command',
            })

            const tr = state.tr

            dispacth(
              typeof pos === 'number'
                ? tr.insert(pos, [image, editor.state.schema.text(' ')])
                : tr.replaceSelectionWith(image).insertText(' '),
            )
          }

          return true
        }
      },
      deleteInlineImage(state, dispacth, view) {
        if (!isNodeSelection(state.selection)) return false

        const { $from, node } = state.selection

        if (node.type.name !== nodeType.name) return false

        if (dispacth) {
          const tr = state.tr

          const from = $from.pos
          const to = from + node.nodeSize

          tr.delete(from, to)

          dispacth(tr)
        }

        return true
      },
      updateImage(attrs, { allowNodeTypeName = INLINE_IMAGE_NAME, keepAspectRatio = true } = {}) {
        return (state, dispatch, view) => {
          const editorView = view ?? editor.view

          if (!attrs) return false
          if (!isNodeSelection(state.selection)) return false

          const { $from, node } = state.selection

          if (node.type.name !== allowNodeTypeName) return false

          if (dispatch) {
            const tr = state.tr

            const pos = $from.pos

            if (attrs.width) {
              tr.setNodeAttribute(pos, 'width', attrs.width)
            }

            if (attrs.height) {
              tr.setNodeAttribute(pos, 'height', attrs.height)
            }

            if (keepAspectRatio) {
              const imageDOM = editorView.nodeDOM(pos) as HTMLImageElement

              if (attrs.width && !attrs.height) {
                const adjustedHeight = adjustedDimension(imageDOM, {
                  target: 'height',
                  resizedWidth:
                    attrs.width === 'full'
                      ? (imageDOM.parentElement ?? editor.view.dom).clientWidth
                      : attrs.width,
                })

                tr.setNodeAttribute(pos, 'height', Math.round(adjustedHeight))
              }

              if (attrs.height && !attrs.width) {
                const adjustedWidth = adjustedDimension(imageDOM, {
                  target: 'width',
                  resizedHeight: attrs.height,
                })

                tr.setNodeAttribute(pos, 'width', Math.round(adjustedWidth))
              }
            }

            dispatch(tr)
          }

          return true
        }
      },
      uploadImage({ source }) {
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
                widget: options.createPlaceholder({ dimension }),
              }),
            })

          tr = createPlaceholderTr
          dispatch?.(createPlaceholderTr.insertText(' '))

          const { src, alt, title } = await options.uploadImage({
            source,
            isFile,
          })

          const image = nodeType.create(
            utils.createAttrs({
              src,
              alt,
              title,
              originalWidth: dimension.width,
              originalHeight: dimension.height,
              by: 'command',
            }),
          )

          const insertPos = AsyncPlaceholder.utils.findAsyncPlaceholder({
            state: editor.state,
            id: placeholderWidgetId,
          })!.from!

          const { tr: removePlaceholderTr } = AsyncPlaceholder.utils.setAsyncPlaceholderAction(
            editor.state.tr,
            { type: 'remove', id: placeholderWidgetId },
          )

          dispatch?.(removePlaceholderTr.insert(insertPos, image))

          return true
        }
      },
      convertBlockImageToInlineImage(state, dispatch, view) {
        if (!isNodeSelection(state.selection)) return false

        const { $from, node } = state.selection

        if (node.type.name !== BLOCK_IMAGE_NAME) return false

        const from = $from.before()
        const to = $from.after()

        const tr = state.tr

        if (dispatch) {
          tr.replaceWith(
            from,
            to,
            nodeType.create(
              {
                ...node.attrs,
                width: null,
              },
              node.content,
              node.marks,
            ),
          )

          dispatch(tr)
        }

        return true
      },
    }
  },
  utils() {
    return {
      getImageAttrsFromDOM(dom) {
        const imageDOM = dom as HTMLImageElement

        const dataset = {
          width: dom.dataset['original-width'],
          height: dom.dataset['original-height'],
          align: dom.dataset['blockAlign'],
          by: dom.dataset['by'],
        }

        const dimensionStyle = {
          width: dom.style.width.replace('px', ''),
          height: dom.style.height.replace('px', ''),
        }

        return {
          src: imageDOM.getAttribute('src')!,
          alt: imageDOM.getAttribute('alt'),
          title: imageDOM.getAttribute('title'),
          width:
            dataset.align === 'full'
              ? 'full'
              : Number(dimensionStyle.width) || Number(imageDOM.getAttribute('width')) || null,
          originalWidth: Number(dataset.width) || 0,
          height: Number(dimensionStyle.height) || Number(imageDOM.getAttribute('height')) || null,
          originalHeight: Number(dataset.height) || 0,
          by: (dataset.by as ImageAttrs['by'] | undefined) ?? 'natural',
        }
      },
      createAttrs(attrs) {
        return {
          src: attrs.src,
          alt: attrs.alt || null,
          title: attrs.title || null,
          width:
            (typeof attrs.width === 'number' && attrs.width !== 0) || attrs.width === 'full'
              ? attrs.width!
              : null,
          height: typeof attrs.height === 'number' && attrs.height !== 0 ? attrs.height! : null,
          originalWidth:
            typeof attrs.originalWidth === 'number' && attrs.originalWidth !== 0
              ? attrs.originalWidth!
              : null,
          originalHeight:
            typeof attrs.originalHeight === 'number' && attrs.originalHeight !== 0
              ? attrs.originalWidth!
              : null,
          by: attrs.by || 'natural',
        }
      },
    }
  },
  plugins({ options, nodeType }) {
    const key = new PluginKey('image-plugin')

    const plugin = new Plugin({
      key,
      props: {
        nodeViews: {
          [INLINE_IMAGE_NAME]: (node, view, getPos, decorations, innerDecorations) =>
            new ImageView({
              node,
              view,
              getPos,
              decorations,
              innerDecorations,
              allowedNodeTypeName: INLINE_IMAGE_NAME,
              fallbackURL: options.fallbackURL,
              toDOM: nodeType.spec.toDOM!,
            }),
        },
      },
    })

    return [plugin]
  },
})
