import EventEmitter from 'events'
import { DOMOutputSpec, DOMSerializer, Node } from 'prosemirror-model'
import { NodeSelection } from 'prosemirror-state'
import { EditorView, NodeView, ViewMutationRecord } from 'prosemirror-view'

import { NodeViewConstructorParams } from '../../../typing'
import { base64ToBlob, getNodeAttrs, imageAspectRatio, isNodeSelection } from '../../utils'
import { BLOCK_IMAGE_NAME } from './block-image'
import { ImageAttrs, INLINE_IMAGE_NAME } from './inline-image'

export interface ImageViewEventMap {
  ['error']: []
}

export interface ImageViewRender {
  toDOM: (node: Node) => DOMOutputSpec
}

export interface ImageViewOptions {
  allowedNodeTypeName?: string
  fallbackURL?: string
  onClick?: (dom: HTMLImageElement) => void
}

export class ImageView implements NodeView {
  dom: HTMLImageElement
  contentDOM?: HTMLElement
  node: Node

  view: EditorView
  getPos: NodeViewConstructorParams['getPos']

  eventEmitter: EventEmitter<ImageViewEventMap>
  render: ImageViewRender
  options: ImageViewOptions

  constructor({
    node,
    view,
    getPos,
    toDOM,
    allowedNodeTypeName,
    fallbackURL,
    onClick,
  }: NodeViewConstructorParams & ImageViewRender & ImageViewOptions) {
    this.node = node

    this.view = view
    this.getPos = getPos

    this.eventEmitter = new EventEmitter<ImageViewEventMap>()

    this.eventEmitter.on('error', () => {
      const nodeAttributes = this.getAttrs()
      const pos = this.getPos()

      if (nodeAttributes.by !== 'command') return

      const tr = this.view.state.tr

      switch (this.node.type.name) {
        case INLINE_IMAGE_NAME: {
          const from = pos!
          // (InlineImage) insertInlineImage, uploadImage 커맨드에서 ' '(공백) 을 같이 삽입하기 때문에 빈 문자도 같이 포함하여 삭제
          const to = from + this.node.nodeSize + 1

          tr.delete(from, to).setMeta('addToHistory', false)

          break
        }
        case BLOCK_IMAGE_NAME: {
          // (BlockImage) insertBlockImage, uploadImage 커맨드에서 figure 노드와 같이 삽입 함함
          // figure 노드 안에 포함되어 있으므로 figure노드를 삭제하여야 블럭 이미지 단위의 삭제가 가능능

          const $pos = this.view.state.doc.resolve(pos!)

          const from = $pos.before(1)
          const to = from + $pos.node().nodeSize

          tr.delete(from, to).setMeta('addToHistory', false)

          break
        }
      }

      this.view.dispatch(tr)
    })

    this.render = {
      toDOM,
    }

    this.options = {
      allowedNodeTypeName,
      fallbackURL,
      onClick,
    }

    const renderSpec = this.createRenderSpec(node)

    this.dom = renderSpec.dom
    this.contentDOM = renderSpec.contentDOM

    if (!this.dom.complete) {
      const { width, originalWidth, originalHeight } = this.getAttrs(node)

      const aspectRatio = imageAspectRatio({
        width: originalWidth || 0,
        height: originalHeight || 0,
      })

      this.dom.style.width = ((width: ImageAttrs['width']) => {
        if (width) {
          if (width === 'full') return '100%'

          return `${width}px`
        }

        return `${originalWidth}px`
      })(width)

      if (aspectRatio) {
        this.dom.style.aspectRatio = aspectRatio
      }

      this.dom.classList.add('skeleton')
    }

    this.onLoad = this.onLoad.bind(this)
    this.onError = this.onError.bind(this)
    this.onClick = this.onClick.bind(this)

    this.dom.addEventListener('load', this.onLoad)
    this.dom.addEventListener('error', this.onError)
    this.dom.addEventListener('click', this.onClick)
  }

  update(node: Node) {
    const allowedNodeTypeName = this.options.allowedNodeTypeName

    if (allowedNodeTypeName && node.type.name !== allowedNodeTypeName) {
      return false
    } else {
      const pos = this.getPos()

      if (pos !== undefined) {
        const dom = this.view.nodeDOM(pos)

        if (dom && (dom as HTMLElement).tagName !== 'IMG') {
          return false
        }
      }
    }

    this.node = node
    this.updateDOM(node)

    return true
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    if (!this.dom.contains(mutation.target)) return false

    return true
  }

  setSelection(anchor: number, head: number, root: Document | ShadowRoot) {
    getSelection()?.removeAllRanges()
  }

  destroy() {
    this.eventEmitter.removeAllListeners()

    this.dom.removeEventListener('load', this.onLoad)
    this.dom.removeEventListener('error', this.onError)
    this.dom.removeEventListener('click', this.onClick)
  }

  // custom image view method

  get imageViewEventListenerName(): Readonly<Record<'error', keyof ImageViewEventMap>> {
    return { error: 'error' }
  }

  static openPopup(
    dom: HTMLImageElement,
    {
      fallbackURL,
      popupWidth = 400,
      popupHeight = 400,
    }: { fallbackURL?: string; popupWidth?: number; popupHeight?: number } = {},
  ) {
    const left = (globalThis.screen.width - popupWidth) / 2
    const top = (globalThis.screen.height - popupHeight) / 2

    if (dom.closest('a')) {
      return
    }

    const src = dom.classList.contains('image-error') ? fallbackURL : dom.src

    if (src?.startsWith('data:image')) {
      const previewUrl = URL.createObjectURL(base64ToBlob(src))

      const popupWindow = globalThis.open(
        previewUrl,
        '_blank',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`,
      )

      popupWindow!.addEventListener('unload', () => {
        URL.revokeObjectURL(previewUrl)
      })

      return
    }

    if (src) {
      globalThis.open(
        src,
        '_blank',
        `noopener,noreferrer,width=${popupWidth},height=${popupHeight},left=${left},top=${top}`,
      )
    }
  }

  createRenderSpec(node: Node) {
    const { dom: imageDOM, contentDOM } = DOMSerializer.renderSpec(
      this.view.dom.ownerDocument,
      this.render.toDOM(node),
    )

    return {
      dom: imageDOM as HTMLImageElement,
      contentDOM,
    }
  }

  getAttrs(node?: Node) {
    const imageNode = node ?? this.node

    return getNodeAttrs<ImageAttrs>(imageNode)
  }

  isLoadedImage(image?: HTMLImageElement) {
    const originalWidth = image ? image.naturalWidth : this.getAttrs().originalWidth

    return !!originalWidth || (image ?? this.dom).complete
  }

  updateNode(targetAttrs: Partial<ImageAttrs>) {
    const tr = this.view.state.tr
    const pos = this.getPos()

    if (typeof pos !== 'number') return tr

    const currentAttrs = this.getAttrs()

    for (const [key, value] of Array.from(Object.entries(targetAttrs))) {
      if (currentAttrs[key as keyof typeof targetAttrs] === value) continue

      tr.setNodeAttribute(pos, key, value)
    }

    return tr
  }

  updateDOM(node?: Node) {
    const imageNode = node ?? this.node
    const attrs = this.getAttrs(imageNode)

    const { dom: targetDOM } = this.createRenderSpec(node ?? this.node)

    // update style
    this.dom.style.cssText = targetDOM.style.cssText

    if (attrs.originalWidth && !this.dom.style['--original-width' as any]) {
      this.dom.style.cssText = `
        ${this.dom.style.cssText}
        --original-width: ${attrs.originalWidth}px;
        --original-height: ${attrs.originalHeight}px;
      `
    }

    // update dataset
    for (const [dataSetKey] of Array.from(Object.entries(this.dom.dataset))) {
      delete this.dom.dataset[dataSetKey]
    }

    for (const [dataSetKey, dataSetValue] of Array.from(Object.entries(targetDOM.dataset))) {
      this.dom.dataset[dataSetKey] = dataSetValue
    }

    // clear
    if (!this.dom.style.cssText) this.dom.removeAttribute('style')
    if (!this.dom.classList.length) this.dom.removeAttribute('class')
  }

  init() {
    if (this.dom.classList.contains('image-error')) return

    this.updateDOM()

    const tr = this.updateNode({
      originalWidth: this.dom.naturalWidth,
      originalHeight: this.dom.naturalHeight,
      by: 'natural',
    })

    if (tr.docChanged) {
      /*
        history에 추가 될 경우
        undo에서 node attrs 를 수정하는 것이 적용되기 때문에
        이미지가 초기 적용된 이후 2번 undo를 해야 이미지가 삭제 됨
      */
      tr.setMeta('addToHistory', false)

      this.view.dispatch(tr)
    }
  }

  onClick() {
    const selection = this.view.state.selection

    if (this.view.editable) {
      if (!isNodeSelection(selection) || !selection.node.eq(this.node)) {
        const pos = this.getPos()

        if (!pos) return

        this.view.dispatch(
          this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)),
        )
      }

      return
    }

    if (this.options.onClick) {
      const imageDOM = this.dom
      this.options.onClick(imageDOM)

      return
    }
  }

  onLoad() {
    const attrs = this.getAttrs()
    const fallbackURL = this.options.fallbackURL

    if (fallbackURL && this.dom.src === fallbackURL) {
      // loaded error image (fallback)
      this.dom.style.maxWidth = `${attrs.width || attrs.originalWidth}px`

      return
    }

    this.dom.classList.remove('skeleton')
    this.init()

    if (!attrs.width) this.dom.style.removeProperty('width')
    if (!attrs.height) this.dom.style.removeProperty('height')
  }

  onError() {
    const fallbackURL = this.options.fallbackURL

    this.dom.className = 'image-error'

    this.dom.style.removeProperty('width')
    this.dom.style.removeProperty('height')

    if (fallbackURL) {
      this.dom.src = fallbackURL
    }

    this.eventEmitter.emit('error')
  }
}
