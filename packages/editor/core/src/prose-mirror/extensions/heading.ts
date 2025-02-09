import { setBlockType } from 'prosemirror-commands'
import { keydownHandler } from 'prosemirror-keymap'
import { Attrs, Fragment, Node, Slice } from 'prosemirror-model'
import { Command, Plugin, PluginKey, TextSelection, Transaction } from 'prosemirror-state'

import { Editor, ZERO_WIDTH_SPACE_UNICODE } from '../../editor'
import {
  CombineProsemirrorKeys,
  MergeConfigMap,
  NonPartial,
  ProsemirrorKeyboard,
  TypedAttributeSpecs,
} from '../../typing'
import {
  combineProsemirrorKeys,
  ContentChildList,
  PROSEMIRROR_KEYBOARD,
  summarizeSelection,
} from '../utils'
import { NodeExtension } from './core'
import { Link } from './link'
import { Paragraph } from './paragraph'

export type HeadingLevels = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingTagName = `h${HeadingLevels}`

export interface HeadingAttrs {
  level: HeadingLevels
  id: string | null
  anchorLinkType: boolean
}

/** heading `node spec` attrs */
export type HeadingAttributeSpecs = TypedAttributeSpecs<HeadingAttrs>

export interface HeadingCommands {
  /** heading 노드로 설정 */
  setHeading: (tagName: HeadingTagName) => Command
  /** heading 노드 해제 */
  unsetHeading: (tagName: HeadingTagName) => Command
  /**
   * 현재 selection 에서
   * - 해당 tagName(h1 ~ h6)의 level(1~6)을 가지는 heading 노드가 있을 경우 해제
   * - 아닌 경우 해당 tagName의 level을 가지는 heading 노드로 설정
   */
  toggleHeading: (tagName: HeadingTagName) => Command
}

type ToggleHeadingShortcutKeys<Levels extends HeadingLevels = HeadingLevels> = Extract<
  CombineProsemirrorKeys<
    [ProsemirrorKeyboard['Mod'], ProsemirrorKeyboard['Alt'], `${HeadingLevels}`]
  >,
  CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], ProsemirrorKeyboard['Alt'], `${Levels}`]>
>

type HeadingShortcutKeys<Levels extends HeadingLevels = HeadingLevels> =
  | ToggleHeadingShortcutKeys<Levels>
  | ProsemirrorKeyboard['Enter']
  | ProsemirrorKeyboard['Backspace']

export type HeadingShortcut<Levels extends HeadingLevels = HeadingLevels> = Record<
  HeadingShortcutKeys<Levels>,
  Command
>

export interface FixAnchorLinkHeading {
  (tr: Transaction, args?: never): Transaction
  (tr: Transaction, args: { node: Node; pos: number }): Transaction
}

export interface HeadingUtils {
  /** 현재 selection 에 tagName 에 해당하는 level(1~6)을 가지는 heading 노드가 있는지 유무 */
  isActive: (tagName: HeadingTagName) => boolean
  /** tagName(h1 ~ h6) 에서 heading 태그의 level(1 ~ 6)을 추출해서 반환 */
  getLevelFromTagName: (tagName: HeadingTagName) => HeadingLevels
  /** heading 노드 attrs 생성을 도와주는 유틸 함수수 */
  createAttrs: (attrs: {
    tagName: HeadingTagName
    id?: HeadingAttrs['id']
    anchorLinkType?: HeadingAttrs['anchorLinkType']
  }) => HeadingAttrs
  /**
   * options에서 허용한 tagName 인지 유무
   * @example
   * ```ts
   * Heading.configureOptions({
   *   levels: ['h1','h2','h3']
   * })
   *
   * Heading.utils.isValidHeadingTagName('h4') // false
   * Heading.utils.isValidHeadingTagName('h2') // true
   * ```
   */
  isValidHeadingTagName: (tagName: HeadingTagName) => boolean
  /** AnchorLinkHeading(ex. `<h1 id="heading1">content<a href="#heading1"></a></h1>`) 노드인지 유무 */
  isAnchorLinkHeading: (node: Node) => boolean
  /** textContent로 id를 생성해주는 유틸 함수 */
  getIdFromTextContent: (textContent: string) => string
  /**
   * ```ts
   * interface FixAnchorLinkHeading {
   *   (tr: Transaction, args?: never): Transaction
   *   (tr: Transaction, args: { node: Node; pos: number }): Transaction
   * }
   * ```
   *
   * - anchor link에 해당하는 heading 노드가 올바른 구조로 될 수 있도록 수정
   * - `{node: Node; pos: number}` 옵션을 제공할 경우 해당 노드를 대상으로 동작,\
   *   제공하지 않을 경우 전체 노드 중 anchor link에 해당하는 heading 노드를 대상으로 동작
   */
  fixAnchorLinkHeading: FixAnchorLinkHeading
}

export interface HeadingOptions {
  /**
   * - `h1` ~ `h6` 중 적용할 노드의 배열
   * - 예. `['h1', 'h2', 'h3']` => `h1`, `h2`, `h3` 노드만 적용
   * - 기본값 `['h1', 'h2', 'h3']`
   */
  levels: HeadingTagName[]
  /**
   * - 허용할 mark type 이름의 배열
   * - anchorLinkHeading이 `true` 이고 allowMarks 에 Link type 이름(`Link.name`) 이 없을 경우 allowMarks 에 추가
   * - `'_'` 로 설정할 경우 모든 mark를 허용
   */
  allowMarks?: '_' | string[]
  /**
   * heading 노드가 anchor link 로 동작하도록 할지 여부
   * @example
   * ```html
   *   <!-- anchor link -->
   *   <h1 id="제목1">
   *    제목
   *    <a href="#제목1"></a>
   *   </h1>
   * ```
   */
  anchorLinkHeading?: boolean
}

/** html 문자열에서 heading 태그를 추출하기 위한 정규표현식 */
export const headingRegex = /<h[1-6][^>]*>.*?<\/h[1-6]>/g

export const DEFAULT_HEADING_OPTIONS: Readonly<NonPartial<HeadingOptions>> = {
  levels: ['h1', 'h2', 'h3'],
  allowMarks: [],
  anchorLinkHeading: false,
}

export const HEADING_NAME = 'heading' as const

/**
 * heading(`h1` ~ `h6`) node extension
 *
 * **shortcut**
 * - `Mod+Alt+1` ~ `Mod+Alt+6`
 *   - toggleHeading(`h1` ~ `h6`)
 * - `Enter`
 *   - heading 노드로 유지하지 않고, paragraph 노드로 변환해서 적용하기 위해 적용
 *     - heading 노드에서 Enter 키 입력 시 Prosemirror base keymap Enter 에서는 split 된 노드가 heading노드로 유지 됨
 * - `Backspace`
 *   - heading 노드이고, 빈 텍스트 일 경우 heading 노드를 해제
 */
export const Heading = NodeExtension.create<
  MergeConfigMap<{
    name: typeof HEADING_NAME
    commands: HeadingCommands
    shortcut: HeadingShortcut
    utils: HeadingUtils
  }>,
  HeadingOptions
>({
  name: HEADING_NAME,
  priority: 52,
  options: {
    ...DEFAULT_HEADING_OPTIONS,
  },
  extendProseMirrorBaseNodeSpec: {
    key: 'heading',
    spec({ baseNodeSpec, options }) {
      const marks = (({
        anchorLinkHeading,
        allowMarks,
      }: Pick<HeadingOptions, 'anchorLinkHeading' | 'allowMarks'>) => {
        if (allowMarks === '_') {
          return
        }

        const resultMarks = allowMarks?.length ? [...allowMarks] : []

        if (anchorLinkHeading && !allowMarks?.includes(Link.name)) {
          resultMarks.push(Link.name)
        }

        return resultMarks.join(' ')
      })({
        anchorLinkHeading: options.anchorLinkHeading,
        allowMarks: options.allowMarks,
      })

      return {
        ...baseNodeSpec,
        marks,
        attrs: {
          ...baseNodeSpec.attrs,
          id: { default: null, validate: 'string|null' },
          anchorLinkType: { default: false, validate: 'boolean' },
        } as HeadingAttributeSpecs,
        parseDOM: options.levels.map((tagName) => {
          return {
            tag: tagName,
            getAttrs(dom) {
              const anchorLink = dom.querySelector<HTMLAnchorElement>('a[href^="#"]')

              const shouldActiveAnchorLinkHeading =
                (options?.anchorLinkHeading ?? DEFAULT_HEADING_OPTIONS.anchorLinkHeading) &&
                !!anchorLink

              const attrs = Heading.utils.createAttrs({
                tagName,
                id: shouldActiveAnchorLinkHeading ? anchorLink?.id || dom.id || null : null,
                anchorLinkType: shouldActiveAnchorLinkHeading,
              }) as Attrs

              return {
                ...attrs,
              }
            },
          }
        }),
        toDOM(node, attributes) {
          return [
            `h${node.attrs.level}`,
            {
              ...attributes,
              ...(options.anchorLinkHeading && node.attrs.id && { id: node.attrs.id }),
            },
            0,
          ]
        },
      }
    },
  },
  commands({ utils, nodeType, options }) {
    return {
      setHeading(tagName) {
        return (state, dispatch, view) => {
          if (view && !view.editable) return false

          if (!utils.isValidHeadingTagName(tagName)) return false

          const setHeadingBlockType = setBlockType(
            nodeType,
            utils.createAttrs({
              tagName,
              ...(options.anchorLinkHeading && {
                id: utils.getIdFromTextContent(state.selection.$from.node().textContent),
                anchorLinkType: true,
              }),
            }),
          )

          const canSetBlock = setHeadingBlockType(state)

          if (!canSetBlock) {
            return false
          }

          return setHeadingBlockType(state, dispatch, view)
        }
      },
      unsetHeading(tagName) {
        return (state, dispatch, view) => {
          if (!utils.isValidHeadingTagName(tagName)) return false
          if (!utils.isActive(tagName)) return false

          const { $from, $to } = state.selection
          const tr = state.tr

          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type === nodeType && node.attrs.level === utils.getLevelFromTagName(tagName)) {
              const textContent = node.textContent.replace(ZERO_WIDTH_SPACE_UNICODE, '')

              const paragraph = textContent
                ? Paragraph.nodeType.create(null, state.schema.text(textContent))
                : Paragraph.nodeType.createAndFill(null, null, [])

              if (paragraph) {
                tr.replaceWith(pos, pos + node.nodeSize, paragraph)
              }
            }
          })

          if (!tr.docChanged) return false

          dispatch?.(tr)

          return true
        }
      },
      toggleHeading(tagName) {
        return (state, dispatch, view) => {
          if (view && !view.editable) return false

          if (utils.isActive(tagName)) return this.unsetHeading(tagName)(state, dispatch, view)

          return this.setHeading(tagName)(state, dispatch, view)
        }
      },
    }
  },
  shortcut({ commands, utils, options, nodeType }) {
    const headingTags = options?.levels?.length ? options.levels : DEFAULT_HEADING_OPTIONS.levels

    const keys = {
      toggleHeading: (tag: HeadingTagName) =>
        combineProsemirrorKeys('⌘', PROSEMIRROR_KEYBOARD.Alt, `${utils.getLevelFromTagName(tag)}`),
      splitHeading: PROSEMIRROR_KEYBOARD.Enter,
      unsetHeadingWhenEmpty: PROSEMIRROR_KEYBOARD.Backspace,
    } as const

    const toggleCommands = {
      ...headingTags.reduce(
        (toggleShortcut, tag) => {
          return {
            ...toggleShortcut,
            [keys.toggleHeading(tag)]: commands.toggleHeading(tag),
          }
        },
        {} as Record<ToggleHeadingShortcutKeys, Command>,
      ),
    }

    return {
      ...toggleCommands,
      [keys.splitHeading]: (state, dispatch, view) => {
        const { $from, empty, atStart, isAnchorLinkHeading } = summarizeSelection(
          state.selection,
          ({ resolvedPos, summerizedSelection }) => {
            return {
              ...resolvedPos,
              isAnchorLinkHeading:
                summerizedSelection.empty && utils.isAnchorLinkHeading(resolvedPos.$from.node()),
            }
          },
        )

        if (!empty) return false

        const node = $from.node()

        if (node.type.name !== nodeType.name) return false

        const headingTagName = `h${node.attrs.level}` as HeadingTagName

        const pos = $from.pos
        const textContent = node.textContent.replace(ZERO_WIDTH_SPACE_UNICODE, '')

        if (atStart) {
          if (textContent) return false

          if (isAnchorLinkHeading) {
            // replace: anchorLinkHeading -> paragraph (lift)
            commands.toggleHeading(headingTagName)(state, dispatch, view)

            return true
          }

          return false
        }

        if (textContent) {
          const tr = state.tr

          if (isAnchorLinkHeading) {
            tr.split(pos, undefined, [{ type: Paragraph.nodeType }])

            const { $from } = tr.selection

            const newNode = tr.doc.nodeAt($from.before())

            if (!newNode) return false

            let anchorLinkNodePos: number | undefined

            newNode.descendants((node, pos) => {
              if (typeof anchorLinkNodePos === 'number') return false

              if (Link.utils.anchorLinkMarkIsInSet(node.marks)) {
                anchorLinkNodePos = pos

                return false
              }
            })

            if (typeof anchorLinkNodePos !== 'number') {
              return false
            }

            const cut = newNode.cut(0, anchorLinkNodePos)

            const from = $from.before()
            const to = from + newNode.nodeSize

            tr.replaceWith(from, to, cut)

            dispatch?.(tr)

            return true
          }

          tr.split(pos, undefined, [{ type: Paragraph.nodeType }])

          dispatch?.(tr)

          return true
        }

        commands.toggleHeading(headingTagName)(state, dispatch, view)

        return true
      },
      [keys.unsetHeadingWhenEmpty]: (state, dispatch, view) => {
        const { $from, empty, atStart } = summarizeSelection(
          state.selection,
          ({ resolvedPos }) => resolvedPos,
        )

        if (!empty) return false

        const node = $from.node()

        if (node.type.name !== nodeType.name) return false

        const tr = state.tr

        const textContent = node.textContent.replace(ZERO_WIDTH_SPACE_UNICODE, '')

        if (atStart && !textContent) {
          tr.replaceRange($from.pos - 1, $from.end(), Slice.empty)

          if (dispatch) {
            dispatch(tr)
          }

          return true
        }

        return false
      },
    }
  },
  utils({ editor, nodeType }) {
    return {
      isActive(tagName) {
        const level = this.getLevelFromTagName(tagName)

        return editor.isActive(nodeType, { level }, { exactMatchAttrs: false })
      },
      getLevelFromTagName(tagName) {
        return Number(tagName.split('h')[1]) as HeadingLevels
      },
      isValidHeadingTagName(tagName) {
        const validHeadingTags = nodeType.spec.parseDOM!.map((node) => node.tag)

        return validHeadingTags.includes(tagName)
      },
      createAttrs({ tagName, id = null, anchorLinkType = false }) {
        return {
          level: this.getLevelFromTagName(tagName),
          id,
          anchorLinkType,
        }
      },
      isAnchorLinkHeading(node) {
        if (node.type.name !== nodeType.name) return false

        return (node.attrs as HeadingAttrs).anchorLinkType
      },
      getIdFromTextContent(textContent) {
        return textContent
          .replace(ZERO_WIDTH_SPACE_UNICODE, '')
          .replace(/[<>[\]?()]/g, '')
          .replace(/[ ]/g, '-')
      },
      fixAnchorLinkHeading(tr, target) {
        if (editor.view.composing) return tr

        if (target) {
          const { node, pos } = target

          if (!this.isAnchorLinkHeading(node)) return tr

          const anchorLinkNode = getAnchorLinkNode({ targetNode: node, headingUtils: this })

          if (!anchorLinkNode) {
            insertAnchorLinkNodeIn(tr, { node, pos })

            return tr
          }

          if (!anchorLinkNode.node.sameMarkup(node.lastChild!)) {
            cutOverflowContent(tr, { node, pos, anchorLinkNodeIndex: anchorLinkNode.index })

            return tr
          }

          return tr
        }

        tr.doc.nodesBetween(0, tr.doc.content.size, (node, pos, parent, index) => {
          if (node.type.name !== nodeType.name) return

          this.fixAnchorLinkHeading(tr, { node, pos })
          updateAnchorLinkId(tr, {
            editor,
            headingUtils: this,
            node: tr.doc.child(index),
            pos: tr.mapping.map(pos),
          })
        })

        return tr
      },
    }
  },
  plugins({ editor, utils, options }) {
    if (options.anchorLinkHeading) {
      const anchorLinkHeading = new Plugin({
        key: new PluginKey('anchor-link-heading'),
        props: {
          transformPastedHTML(html) {
            const headings = html.match(headingRegex)

            if (headings) {
              const parser = new DOMParser()

              headings.forEach((headingHTML) => {
                const matchedTag = headingHTML.match(/^<h(?<level>[1-6])/)!
                const level = matchedTag.groups!.level

                const doc = parser.parseFromString(headingHTML, 'text/html')
                const heading = doc.querySelector<HTMLHeadingElement>(`h${level}`)!

                const headingId = utils.getIdFromTextContent(heading.textContent ?? '')
                heading.id = headingId

                const link = heading.querySelector('a')
                if (!link) {
                  const linkElement = document.createElement('a')
                  linkElement.href = `#${headingId}`

                  heading.appendChild(linkElement)
                }

                html = html.replace(headingHTML, heading.outerHTML)
              })
            }

            return html
          },
          handleKeyDown: keydownHandler({
            [PROSEMIRROR_KEYBOARD.Backspace]: (state, dispacth) => {
              const { $from, empty } = state.selection

              const parentNode = $from.parent

              if (!empty) return false
              if (!utils.isAnchorLinkHeading(parentNode)) return false

              const anchorLinkNode = getAnchorLinkNode({
                targetNode: parentNode,
                headingUtils: utils,
              })

              if (!anchorLinkNode) return false

              const parentStart = $from.start()

              const isCursorAtAnchorLinkMark = $from.pos === parentStart + anchorLinkNode.offset + 1

              if (!isCursorAtAnchorLinkMark) return false

              if (dispacth) {
                const tr = state.tr

                const $near = tr.doc.resolve(parentStart + anchorLinkNode.offset)

                dispacth(tr.setSelection(TextSelection.near($near)))
              }

              return true
            },
          }),
        },
        appendTransaction(transactions, prevState, currentState) {
          if (editor.view.composing) return null

          const tr = currentState.tr
          utils.fixAnchorLinkHeading(tr)

          return tr.docChanged ? tr : null
        },
      })

      return [anchorLinkHeading]
    }

    const key = new PluginKey('heading')
    const plugin = new Plugin({
      key,
      props: {
        transformPastedHTML(html) {
          const headings = html.match(headingRegex)

          if (headings) {
            headings.forEach((headingHTML) => {
              // heading 태그의 id 삭제
              const parsedHeadingHTML = headingHTML.replace(
                /<h([1-6])([^>]*)\s+id=['"][^'"]*['"]([^>]*)>/g,
                '<h$1$2$3>',
              )

              html = html.replace(headingHTML, parsedHeadingHTML)
            })
          }

          return html
        },
      },
    })

    return [plugin]
  },
})

// ---- internal util function ----

/**
 * anchorLink 노드 반환
 * @internal
 */
function getAnchorLinkNode({
  targetNode,
  headingUtils,
}: {
  targetNode: Node
  headingUtils: HeadingUtils
}): { node: Node; offset: number; index: number } | null {
  if (!headingUtils.isAnchorLinkHeading(targetNode)) return null

  let anchorLinkNode: Node | null = null
  let index = 0
  let offset = 0

  for (const child of ContentChildList.from(targetNode)) {
    if (Link.utils.anchorLinkMarkIsInSet(child.marks)) {
      anchorLinkNode = child

      break
    }

    offset += child.nodeSize
    index += 1
  }

  if (anchorLinkNode) {
    return {
      node: anchorLinkNode,
      offset,
      index,
    }
  }

  return null
}

/**
 * anchorLink에 해당하는 heading 노드의 id와 , link href 를 text content 기반의 id로 업데이트
 * @internal
 */
function updateAnchorLinkId(
  tr: Transaction,
  {
    editor,
    headingUtils,
    node,
    pos,
  }: { editor: Editor; headingUtils: HeadingUtils; node: Node; pos: number },
): Transaction {
  if (!headingUtils.isAnchorLinkHeading(node)) return tr
  if (editor.view.composing) return tr

  const expectId = headingUtils.getIdFromTextContent(node.textContent)

  const headingId = node.attrs.id

  if (headingId !== expectId) {
    tr.setNodeMarkup(
      pos,
      editor.state.schema.nodes[HEADING_NAME]!,
      {
        ...node.attrs,
        id: expectId,
      },
      undefined,
    )
  }

  const anchorLinkMark = Link.utils.anchorLinkMarkIsInSet(node.lastChild!.marks)!
  const anchorLinkNodePos = pos + node.content.size

  if (anchorLinkMark.attrs.href.replace(/^#/, '') !== expectId) {
    tr.addMark(anchorLinkNodePos, anchorLinkNodePos + 1, Link.utils.createAnchorLinkMark(expectId))
  }

  return tr
}

/**
 * anchorLinkHeading 노드이지만, anchorLinkNode(mark)가 존재하지 않을 경우 추가
 * @internal
 */
function insertAnchorLinkNodeIn(
  tr: Transaction,
  { node, pos }: { node: Node; pos: number },
): Transaction {
  const newAnchorLinkNode = {
    node: Link.utils.createAnchorLinkNode({
      hash: node.attrs.id,
    }),
    targetPos: pos + node.content.size + 1,
  }

  tr.insert(newAnchorLinkNode.targetPos, newAnchorLinkNode.node)

  return tr
}

/**
 * anchorLinkHeading 노드에서 anchorLinkNode(mark) 이후 입력된 콘텐츠를 anchorLinkNode 앞으로 삽입
 * @internal
 */
function cutOverflowContent(
  tr: Transaction,
  { node, pos, anchorLinkNodeIndex }: { node: Node; pos: number; anchorLinkNodeIndex: number },
): Transaction {
  const mergedContentNodes = ContentChildList.from(node).filter(
    (child, index) => index < anchorLinkNodeIndex || index > anchorLinkNodeIndex,
  )

  const fragment = Fragment.fromArray([
    ...mergedContentNodes,
    Link.utils.createAnchorLinkNode({
      hash: node.attrs.id,
    }),
  ])

  const mapping = {
    from: pos + 1,
    to: pos + node.nodeSize - 1,
  }

  tr.replaceWith(mapping.from, mapping.to, fragment)

  const $near = tr.doc.resolve(tr.mapping.map(pos) + fragment.size)
  tr.setSelection(TextSelection.near($near))

  return tr
}
