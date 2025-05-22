import { CodeMirrorStyleSpec } from '../../theme/editor-theme'
import { Decoration, DecorationSet, EditorView, ViewUpdate } from '@codemirror/view'
import { combineConfig, EditorState, Facet, RangeSet } from '@codemirror/state'
import { getMatchedDocTag } from './tag-list'
import { SyntaxNode, Tree } from '@lezer/common'

import { getMatchedLink } from './auto-link'
import { platform } from 'os'
import { DeepRequired } from '../../../../typing'
import { SyntaxTreePlugin, syntaxTreeViewPlugin } from '../../syntax-tree-plugin'
import { JAVA_SCRIPT_SYNTAXNODE_NAME } from '../../languages'

export interface CommentHighlightOptions {
  style?: {
    light: {
      atSymbol: CodeMirrorStyleSpec
      tagName: CodeMirrorStyleSpec
      link: {
        element: CodeMirrorStyleSpec
        hover: CodeMirrorStyleSpec
      }
    }
    dark: {
      atSymbol: CodeMirrorStyleSpec
      tagName: CodeMirrorStyleSpec
      link: {
        element: CodeMirrorStyleSpec
        hover: CodeMirrorStyleSpec
      }
    }
  }
}

const defaultStyle: DeepRequired<CommentHighlightOptions['style']> = {
  light: {
    atSymbol: {
      color: '#5b9ded',
    },
    tagName: {
      color: '#3586eb',
    },
    link: {
      element: {},
      hover: {
        color: '#3cb4f0',
      },
    },
  },
  dark: {
    atSymbol: {
      color: '#499be3',
    },
    tagName: {
      color: '#9681d6',
    },
    link: {
      element: {},
      hover: {
        color: '#499be3',
      },
    },
  },
}

export const jsDocHighlightOptions = Facet.define<
  CommentHighlightOptions,
  DeepRequired<CommentHighlightOptions>
>({
  combine(value) {
    return combineConfig<DeepRequired<CommentHighlightOptions>>(value, {
      style: defaultStyle,
    })
  },
})

const LINK_FOLLOW_CLASSNAME = 'link--follow'

// mac os에서는 command key, 이외의 os(window, linux)는 ctrl key 를 기준으로 follow 링크를 활성화
// 모바일에선 편집 중 상태에서 follow 링크 기능 제공하지 않을 예정으로 체크하지 않음
const openFollowLinkAsWindow = () => {
  if (typeof window === 'undefined') {
    // 서버환경에서는 nodejs os 내장 라이브러리 활용
    return platform() !== 'darwin'
  }

  // 브라우저 환경에서는 os.platform 이 'browser' 로 반환되어 navigator.userAgent로 판별해야 함
  return !/Mac/.test(navigator.userAgent)
}

const getFollowLinkTriggerKey = () => {
  if (openFollowLinkAsWindow()) return 'Control'

  return 'Meta'
}

const pressedFollowLinkTriggerKey = (e: KeyboardEvent | MouseEvent) => {
  const eventType = e.type

  const followLinkTriggerKey = getFollowLinkTriggerKey()

  if (eventType === 'keyup') {
    return (e as KeyboardEvent).key === followLinkTriggerKey
  }

  if (eventType === 'keydown' || eventType === 'mousedown') {
    if (followLinkTriggerKey === 'Control') {
      return e.ctrlKey
    }

    return e.metaKey
  }

  return false
}

export const commentHighlight = ({ style }: CommentHighlightOptions = {}) => {
  return [
    jsDocHighlightOptions.of({
      style,
    }),
    EditorView.baseTheme({
      '&light .jsdoc-tag, &light .jsdoc-tag > *': {
        ...(style?.light.tagName ? { ...style.light.tagName } : { ...defaultStyle.light.tagName }),
        display: 'inline',
      },
      '&light .jsdoc-tag-at-symbol, &light .jsdoc-tag-at-symbol > *': {
        ...(style?.light.atSymbol
          ? { ...style.light.atSymbol }
          : { ...defaultStyle.light.atSymbol }),
        display: 'inline',
      },
      '&dark .jsdoc-tag, &dark .jsdoc-tag > *': {
        ...(style?.dark.tagName ? { ...style.dark.tagName } : { ...defaultStyle.dark.tagName }),
        display: 'inline',
      },
      '&dark .jsdoc-tag-at-symbol, &dark .jsdoc-tag-at-symbol > *': {
        ...(style?.dark.atSymbol ? { ...style.dark.atSymbol } : { ...defaultStyle.dark.atSymbol }),
        display: 'inline',
      },
      // link
      '& .link': {
        display: 'inline-flex',
        cursor: 'auto',
      },
      '& .link > *': {
        textDecoration: 'underline',
        textUnderlineOffset: '0.3em',
        transition: 'color 0.2s',
      },
      '&light .link > *': {
        ...(style?.light.link.element
          ? { ...style.light.link.element }
          : { ...defaultStyle.light.link.element }),
      },
      '&dark .link > *': {
        ...(style?.dark.link.element
          ? { ...style.dark.link.element }
          : { ...defaultStyle.dark.link.element }),
      },
      [`&.${LINK_FOLLOW_CLASSNAME} .link:hover`]: {
        cursor: 'pointer',
      },
      [`&light.${LINK_FOLLOW_CLASSNAME} .link:hover > *`]: {
        ...(style?.light.link.hover
          ? { ...style.light.link.hover }
          : { ...defaultStyle.light.link.hover }),
      },
      [`&dark.${LINK_FOLLOW_CLASSNAME} .link:hover > *`]: {
        ...(style?.dark.link.hover
          ? { ...style.dark.link.hover }
          : { ...defaultStyle.dark.link.hover }),
      },
    }),
    syntaxTreeViewPlugin(CommentJsDocTagHighlight, {
      decorations: (v) => v.decorations,
    }),
    syntaxTreeViewPlugin(CommentLinkHighlight, {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown(event, view) {
          const target = (event.target as HTMLElement).closest<HTMLDivElement>('.link[data-link]')

          if (!target) return
          if (!target.dataset['link']) return

          if (!pressedFollowLinkTriggerKey(event)) return

          const link = document.createElement('a')
          link.href = target.dataset['link']
          link.target = '_blank'

          link.click()

          return true
        },
        keydown(event, view) {
          if (!pressedFollowLinkTriggerKey(event)) return

          view.dom.classList.add(LINK_FOLLOW_CLASSNAME)
        },
        keyup(event, view) {
          if (!pressedFollowLinkTriggerKey(event)) return

          view.dom.classList.remove(LINK_FOLLOW_CLASSNAME)
        },
      },
    }),
  ]
}

class CommentJsDocTagHighlight extends SyntaxTreePlugin {
  jsDocDecoration = {
    tagName: Decoration.mark({
      class: 'jsdoc-tag',
      tagName: 'div',
    }),
    atSymbol: Decoration.mark({
      class: 'jsdoc-tag-at-symbol',
      tagName: 'div',
    }),
  }

  canUpdate({
    viewUpdate,
    updatedTree,
  }: {
    viewUpdate: ViewUpdate
    updatedTree: boolean
  }): boolean {
    return updatedTree || viewUpdate.geometryChanged
  }

  getDecorations({ tree }: { tree: Tree; currentDecorations: DecorationSet }) {
    const matched: ReturnType<typeof getMatchedDocTag> = []

    const { getNodeText } = this

    tree.iterate({
      enter({ name, node }) {
        if (name !== JAVA_SCRIPT_SYNTAXNODE_NAME.BlockComment) return

        const matchedTags = getMatchedDocTag(getNodeText(node), node.from)

        if (matchedTags.length) {
          matched.push(...matchedTags)
        }
      },
    })

    const ranges = matched
      .sort((a, b) => a.from - b.from)
      .map((tag) => {
        if (tag.type === 'atSymbol') {
          return this.jsDocDecoration.atSymbol.range(tag.from, tag.to)
        }

        return this.jsDocDecoration.tagName.range(tag.from, tag.to)
      })

    if (!ranges.length) return RangeSet.empty

    return Decoration.set(ranges)
  }

  getNodeText = (node: SyntaxNode) => {
    return this.view.state.doc.sliceString(node.from, node.to)
  }
}

class CommentLinkHighlight extends SyntaxTreePlugin {
  onInit(tree: Tree) {
    this.view.dom.addEventListener('click', this.#linkHandler)
  }

  onUpdate(tree: Tree, update: ViewUpdate): void {
    if (!this.editableChanged(update)) return

    this.view.dom.classList.toggle(LINK_FOLLOW_CLASSNAME, this.getEditable(update.state) === false)
  }

  canUpdate({
    viewUpdate,
    updatedTree,
  }: {
    viewUpdate: ViewUpdate
    updatedTree: boolean
  }): boolean {
    return updatedTree || viewUpdate.geometryChanged || this.editableChanged(viewUpdate)
  }

  onDestroy(): void {
    this.view.dom.removeEventListener('click', this.#linkHandler)
  }

  getDecorations({ tree }: { tree: Tree; currentDecorations: DecorationSet }) {
    const matched: ReturnType<typeof getMatchedLink> = []

    const { getNodeText } = this

    tree.iterate({
      enter({ name, node }) {
        if (
          name !== JAVA_SCRIPT_SYNTAXNODE_NAME.BlockComment &&
          name !== JAVA_SCRIPT_SYNTAXNODE_NAME.LineComment
        )
          return

        const matchedLinks = getMatchedLink(getNodeText(node), node.from)

        if (matchedLinks.length) {
          matched.push(...matchedLinks)
        }
      },
    })

    const ranges = matched
      .sort((a, b) => a.from - b.from)
      .map((tag) => {
        return this.#createDecoration(tag.href).range(tag.from, tag.to)
      })

    if (!ranges.length) return RangeSet.empty

    return Decoration.set(ranges)
  }

  #linkHandler = (e: MouseEvent) => {
    if (this.getEditable(this.view.state)) return

    const target = e.target as HTMLElement

    const linkTarget = target.closest<HTMLElement>('div.link[data-link]')

    if (!linkTarget) return

    const link = document.createElement('a')
    link.href = linkTarget.dataset['link']!
    link.target = '_blank'

    link.click()
  }

  #createDecoration = (href: string) => {
    return Decoration.mark({
      class: 'link',
      attributes: {
        'data-link': href,
      },
      tagName: 'div',
    })
  }

  getNodeText = (node: SyntaxNode) => {
    return this.view.state.doc.sliceString(node.from, node.to)
  }

  getEditable = (state: EditorState) => {
    return state.facet(EditorView.editable.reader)
  }

  editableChanged = (update: ViewUpdate) => {
    return this.getEditable(update.startState) !== this.getEditable(update.state)
  }
}
