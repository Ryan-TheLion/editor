import { Fragment, Node, NodeType, Slice } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'

import { MergeConfigMap, UnwrapPromise } from '../../../typing'
import {
  convertFragmentToSlice,
  createSkeletonPlaceholder,
  fragmentHasType,
  getImageDimensionFromFile,
  getImageDimensionFromSrc,
  ImageDimension,
} from '../../utils'
import { AsyncPlaceholder } from '../async-placeholder'
import { BlockAlign, BlockAlignment, DEFAULT_BLOCK_ALIGN } from '../block-align'
import { Extension } from '../core'
import { FigCaption, Figure } from '../figure'
import { BLOCK_IMAGE_NAME } from './block-image'
import {
  CreatePlaceholderBaseParams,
  ImageAttrs,
  INLINE_IMAGE_NAME,
  UploadedImageAttrs,
} from './inline-image'

export type ImageNodeTypeName = typeof INLINE_IMAGE_NAME | typeof BLOCK_IMAGE_NAME

export interface ImageFileHandlerUtils {
  /**
   * 이미지 files를 활용해서 업로드 로직을 처리하기 위한 유틸 함수
   *
   * @internal
   */
  handleFiles: ({ files, slice }: { files: File[]; slice: Slice }) => Promise<void>
  /**
   * 변환된 slice를 활용해서 업로드 로직을 처리하기 위한 유틸 함수
   *
   * @internal
   */
  handleSlice: ({ slice, dropPos }: { slice: Slice; dropPos?: number }) => Promise<void>
}

export interface ImageFileHandlerOptions {
  /**
   * 이미지 업로드 중 표시할 placeholder 요소를 만드는 유틸 함수
   */
  createPlaceholder?: (param: CreatePlaceholderBaseParams) => HTMLElement
  /**
   * file 업로드
   * - `blockAlign`
   *   - 업로드 후 이미지를 `BlockImage` 노드로 삽입하고, 설정한 blockAlign 을 적용
   *   - 설정하지 않을 경우 업로드 후 이미지는 `InlineImage` 노드로 삽입 됨
   * - `callback`
   *   - `file`
   *   이미지 file
   *   - `dimension`
   *   이미지 file 의 width, height
   *   - `attrs`
   *     - slice로 변환이 가능한 경우, 변환시 적용된 attrs(없을 수도 있음)
   *     - 있을 경우 alt 등을 설정하는 등에 활용 가능
   */
  uploadFile?: {
    blockAlign?: BlockAlignment
    callback: ({
      file,
      dimension,
      attrs,
    }: {
      file: File
      dimension: ImageDimension
      attrs: Partial<ImageAttrs>
    }) => Promise<UploadedImageAttrs>
  }
  /**
   * slice 에 포함된 이미지 업로드
   * - 업로드 후 `InlineImage` 노드로 삽입
   *   - 이미지가 삽입 된 이후 이미지를 선택해서, `BlockImage.commands.convertInlineImageToBlockImage`로 필요시 `BlockImage` 로 변환해서 사용 가능
   * - `attrs`
   *   - 이미지 노드 attrs
   * - `dimension`
   *   - 이미지 width, height
   */
  uploadImage?: ({
    attrs,
    dimension,
  }: {
    attrs: ImageAttrs
    dimension: ImageDimension
  }) => Promise<UploadedImageAttrs>
}

export const DEFAULT_IMAGE_FILE_HANDLER_OPTIONS = {} satisfies ImageFileHandlerOptions

export const IMAGE_FILE_HANDLER_NAME = 'image_file_handler'

/**
 * `drag & drop`, `paste(붙여넣기)` 에서 이미지 파일을 처리하는 extension
 */
export const ImageFileHandler = Extension.create<
  MergeConfigMap<{
    name: typeof IMAGE_FILE_HANDLER_NAME
    utils: ImageFileHandlerUtils
  }>,
  ImageFileHandlerOptions
>({
  name: IMAGE_FILE_HANDLER_NAME,
  options: {
    ...DEFAULT_IMAGE_FILE_HANDLER_OPTIONS,
  },
  utils({ editor, options }) {
    return {
      async handleSlice({ slice, dropPos }) {
        const placeholderIdMap: Map<Node, string> = new Map()

        // add slice (initial)

        const initialSelection = editor.view.state.selection
        const initialTransaction = editor.view.state.tr

        let state = editor.view.state.apply(
          typeof dropPos === 'number'
            ? initialTransaction.insert(dropPos, slice.content)
            : initialTransaction.replaceSelection(slice),
        )

        // get image from slice

        const initialFrom = typeof dropPos === 'number' ? dropPos : initialSelection.$from.pos
        const initialTo =
          typeof dropPos === 'number' ? dropPos + slice.content.size : state.selection.$to.pos

        const images = await getImagesFromSlice(convertFragmentToSlice(state.doc.content), {
          from: initialFrom,
          to: initialTo,
        })

        // delete image node

        let deleteOffset = 0

        for (let i = 0; i < images.length; i++) {
          const { node, pos, width, height } = images[i]!

          const from = pos - deleteOffset
          const to = from + node.nodeSize

          const deleteTr = state.tr.delete(from, to)
          deleteOffset += node.nodeSize

          images[i]!.pos = from

          const { id, tr: createPlaceholderTr } = AsyncPlaceholder.utils.setAsyncPlaceholderAction(
            deleteTr,
            {
              type: 'add',
              widget:
                options?.createPlaceholder?.({ dimension: { width, height } }) ??
                createImagePlaceholder(node.type.name as ImageNodeTypeName, {
                  width,
                  height,
                }),
              pos: from,
            },
          )

          placeholderIdMap.set(node, id)

          state = state.apply(createPlaceholderTr.setMeta('addToHistory', false))
        }

        editor.view.updateState(state)
        state = editor.view.state

        // add (replace) updated image & remove image placeholder

        const uploadImage = options.uploadImage!

        const updatePromises = images.map(async ({ node, pos, width, height }) => {
          const nodeAttrs = await uploadImage({
            dimension: { width, height },
            attrs: node.attrs as ImageAttrs,
          })

          const baseTr = editor.view.state.tr

          const insertTr = baseTr
            .insert(
              pos,
              createImageNode(node.type, {
                ...nodeAttrs,
                originalWidth: width,
                originalHeight: height,
              }),
            )
            .setMeta('addToHistory', true)

          const { tr: updateImageTr } = AsyncPlaceholder.utils.setAsyncPlaceholderAction(insertTr, {
            type: 'remove',
            id: placeholderIdMap.get(node)!,
          })

          editor.view.dispatch(updateImageTr)
        })

        await Promise.all(updatePromises)
      },
      async handleFiles({ files, slice }) {
        const { blockAlign, callback: uploadFile } = options.uploadFile!

        const placeholderIdMap: Map<File, string> = new Map()

        const hasSliceContent = !!slice.content.childCount

        // replace (delete) selection

        let state = editor.view.state.apply(editor.view.state.tr.deleteSelection())

        const initialFromPos = state.selection.$from.pos

        // create image placeholder

        const createPlaceholderPromises = files.map(async (file, index) => {
          const { width, height } = await getImageDimensionFromFile(file)

          const placeholder = createImagePlaceholder(
            blockAlign ? BLOCK_IMAGE_NAME : INLINE_IMAGE_NAME,
            {
              width,
              height,
              blockAlign,
            },
          )

          const { id, tr } = AsyncPlaceholder.utils.setAsyncPlaceholderAction(state.tr, {
            type: 'add',
            pos: initialFromPos + index,
            widget: placeholder,
          })

          placeholderIdMap.set(file, id)

          state = state.apply(tr.setMeta('addToHistory', false))
        })

        await Promise.all(createPlaceholderPromises)

        editor.view.updateState(state)
        state = editor.view.state

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve('')
          }, 1000 * 5)
        })

        // add (replace) updated image & remove image placeholder

        let offset = 0

        const updateImagePromises = files.map(async (file, index) => {
          const imageNode = hasSliceContent ? slice.content.child(index) : null

          const { width, height } = await getImageDimensionFromFile(file)

          const nodeAttrs = await uploadFile({
            file,
            dimension: {
              width,
              height,
            },
            attrs: {
              ...(imageNode && (imageNode.attrs as ImageAttrs)),
            },
          })

          const targetImageNodeType =
            editor.state.schema.nodes[blockAlign ? BLOCK_IMAGE_NAME : INLINE_IMAGE_NAME]!
          const targetImageNode = createImageNode(
            targetImageNodeType,
            {
              ...nodeAttrs,
              originalWidth: width,
              originalHeight: height,
            },
            { blockAlign },
          )

          const baseTr = editor.view.state.tr
          const pos = Math.min(initialFromPos + offset, baseTr.doc.content.size)

          const insertUpdatedImageTr = baseTr
            .insert(pos, targetImageNode)
            .setMeta('addToHistory', true)

          const { tr } = AsyncPlaceholder.utils.setAsyncPlaceholderAction(insertUpdatedImageTr, {
            type: 'remove',
            id: placeholderIdMap.get(file)!,
          })

          offset += targetImageNode.nodeSize

          editor.view.dispatch(tr)
        })

        await Promise.all(updateImagePromises)
      },
    }
  },
  plugins({ options, utils }) {
    const key = new PluginKey('image-file-handler')

    const plugin = new Plugin({
      key,
      props: {
        handleDrop(view, event, slice, moved) {
          /// moved: true = 에디터 내부 -> 에디터 내부
          /// moved: false = 에디터 외부 -> 에디터 내부

          const hasImageType = fragmentHasImageType(slice.content)

          if (!hasImageType) return false
          if (moved) return false

          utils.handleSlice({
            slice,
            dropPos: view.posAtCoords({ left: event.x, top: event.y })?.pos,
          })

          return true
        },
        handlePaste(view, event, slice) {
          const { uploadFile, uploadImage } = options

          if (!uploadFile && !uploadImage) return false

          const files = event.clipboardData?.files

          if (files?.length) {
            if (!uploadFile) return false

            const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))

            if (!imageFiles.length) return false

            utils.handleFiles({ files: imageFiles, slice })

            return true
          }

          if (!fragmentHasImageType(slice.content)) return false
          if (!uploadImage) return false

          utils.handleSlice({ slice })

          return true
        },
      },
    })

    return [plugin]
  },
})

function createImagePlaceholder(
  type: ImageNodeTypeName,
  {
    width,
    height,
    blockAlign = DEFAULT_BLOCK_ALIGN,
  }: { width: number; height: number; blockAlign?: BlockAlignment },
) {
  if (type === 'inline_image') {
    return createSkeletonPlaceholder({ width, height })
  }

  return BlockAlign.utils.createPlaceholder({
    asFigure: true,
    dimension: {
      width,
      height,
    },
    keepRatio: true,
    align: blockAlign,
  })
}

function createImageNode(
  nodeType: NodeType,
  nodeAttrs: UnwrapPromise<
    ReturnType<NonNullable<ImageFileHandlerOptions['uploadFile']>['callback']>
  > & { originalWidth: number; originalHeight: number },
  { blockAlign }: { blockAlign?: BlockAlignment } = {},
): Node {
  const { src, alt, title, originalWidth, originalHeight } = nodeAttrs

  const imageNode = nodeType.create({
    src,
    alt,
    title,
    originalWidth,
    originalHeight,
  })

  if (blockAlign) {
    return Figure.nodeType.create({ blockAlign }, [imageNode, FigCaption.nodeType.create()])
  }

  return imageNode
}

function fragmentHasImageType(fragment: Fragment) {
  return fragmentHasType(fragment, [INLINE_IMAGE_NAME, BLOCK_IMAGE_NAME])
}

async function getImagesFromSlice(slice: Slice, { from, to }: { from?: number; to?: number } = {}) {
  const imageNodeTypeNames = [INLINE_IMAGE_NAME, BLOCK_IMAGE_NAME]

  const imageNodes: { node: Node; pos: number }[] = []

  slice.content.nodesBetween(from ?? 0, to ?? slice.content.size, (node, start, parent) => {
    if (
      (imageNodeTypeNames as string[]).includes(node.type.name) &&
      parent?.type.name !== BLOCK_IMAGE_NAME
    ) {
      imageNodes.push({
        node,
        pos: start,
      })
    }
  })

  const promises = imageNodes.map(async ({ node, pos }) => {
    const { width, height } = await getImageDimensionFromSrc(node.attrs.src)

    return {
      node,
      pos,
      width,
      height,
    }
  })

  return await Promise.all(promises)
}
