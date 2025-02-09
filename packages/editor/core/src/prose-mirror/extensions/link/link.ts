import { Mark, Node, ParseRule } from 'prosemirror-model'
import { Command, Plugin, PluginKey, TextSelection } from 'prosemirror-state'

import { ZERO_WIDTH_SPACE_UNICODE } from '../../../editor'
import { MergeConfigMap, NonPartial, TypedAttributeSpecs } from '../../../typing'
import { isNodeSelection, setMark, unsetMark } from '../../utils'
import { ExtensionMarkSpec, MarkExtension } from '../core'
import { DEFAULT_HEADING_OPTIONS, Heading, HEADING_NAME, HeadingTagName } from '../heading'
import { BLOCK_LINK_NAME, BlockLink } from './block-link'

/** 링크 target 속성 값 */
export type LinkTarget = '_self' | '_blank' | '_parent' | '_top'

/**
 * link attrs
 *
 * ```ts
 * {
 *   href,
 *   target,
 *   title
 * }
 * ```
 */
export interface LinkAttrs {
  /** 링크 주소 */
  href: string
  /** 링크 target 속성 */
  target: LinkTarget | null
  /** 링크 title 속성 */
  title: string | null
}

export type CreateLinkAttrsParam = Pick<LinkAttrs, 'href'> & Partial<Omit<LinkAttrs, 'href'>>

/** link `spec` attrs */
export type LinkAttributeSpecs = TypedAttributeSpecs<LinkAttrs>

interface CtrlClickToFollowLinkPluginState {
  pressedModKey: boolean
}

export interface LinkCommands {
  /**
   * - link mark 설정
   * - 선택된 범위가 없을 경우(empty), 설정하는 href를 콘텐츠로 가지는 텍스트 노드를 생성하고 해당 노드에 link mark 적용
   */
  setLink: (attrs: CreateLinkAttrsParam) => Command
  /**
   * - link mark 해제
   * - 선택된 범위가 있을 경우, 해당 범위에서의 link mark 를 해제
   * - 선택된 범위가 없을 경우(empty), 해당 커서의 주변에 적용된 link mark 를 해제
   */
  unsetLink: Command
  /** link mark 가 적용되있을 경우 제거, 적용되있지 않은 경우 설정 */
  toggelLink: (attrs: CreateLinkAttrsParam) => Command
}

export interface LinkUtils {
  /**
   * - dom(HTMLElement) 으로 부터 적용할 link attrs를 추출
   * - `allowedAnchorLinkHeading: true` 이고 텍스트 내용이 없을 경우 빈 텍스트의 마크를 적용하기 위해 ZeroWidthSpace 유니코드 적용
   *   - `#` 텍스트에 마크를 적용할 경우 편집할 때 (Backspace 등을 통해) 삭제될 수 있고, 직접 다시 마크를 다시 생성해야 되는 번거로운 작업이 필요함
   *   - 텍스트 내용이 없을 경우 마크가 생성되지 않기 때문에, ZeroWidthSpace 유니코드 문자를 이용해 빈 콘텐츠로 적용되도록 하고, css 를 통해 `#` 문자가 표시될 수 있도록 함
   */
  getLinkAttrs: ({
    dom,
    allowedAnchorLinkHeading,
  }: {
    dom: HTMLElement
    allowedAnchorLinkHeading: NonNullable<LinkOptions['withAnchorLinkHeading']>
  }) => LinkAttrs
  /** link mark attrs 생성을 도와주는 유틸 함수 */
  createAttrs: (attrs: CreateLinkAttrsParam) => LinkAttrs
  /** anchorLink (ex. `<a href='#id'>`) mark를 생성 */
  createAnchorLinkMark: (hash?: string) => Mark
  /** anchorLink (ex. `<a href='#id'>`) mark 가 적용된 text 노드를 생성 후 해당 노드를 반환 */
  createAnchorLinkNode: (args: { hash?: string }) => Node
  /** marks에 anchorLink (ex. `<a href='#id'>`) mark가 존재할 경우 해당 mark 반환 */
  anchorLinkMarkIsInSet: (marks: readonly Mark[]) => Mark | null
  /** link mark 가 적용되었는지 반환 */
  isActive: () => boolean
}

export interface LinkOptions {
  /**
   * - edit mode(`editable = true`) 인 경우, ctrl(mod) 키를 누른 상태에서 링크 클릭 시 링크 이동을 허용하는 기능을 활성화 할지 유무
   * - 기본값 `true`
   */
  ctrlClickToFollowLink?: boolean
  /**
   * @link https://prosemirror.net/docs/ref/#model.MarkSpec.excludes
   *
   * - link mark외 다른 mark가 공존할 수 없도록 적용할 지 유무
   * - 기본값 `true`
   */
  excludeAllMarks?: boolean
  /**
   * anchor link heading (ex. `<h2 id="제목">제목<a href="#제목"></a></h2>`) 에서의 link mark 로 동작 되도록 할 지 유무
   * - `Heading anchorLinkHeading 옵션이 활성화(`true`) 되있는 경우 `withAnchorLinkHeading` 옵션도 같이 활성화(`true`) 해야 함
   * - 기본값 `false`
   * - `true`로 설정 시 허용 할 heading tag name은 `Heading.options.levels ?? DEFAULT_HEADING_OPTIONS.levels` 로 설정되며,
   *  `{headings}` 로 직접 허용 할 heading tag name 을 설정할 수도 있음
   */
  withAnchorLinkHeading?:
    | boolean
    | {
        headings: HeadingTagName[]
      }
}

export const VALID_LINK_TARGET: LinkTarget[] = ['_self', '_blank', '_parent', '_top']

export const DEFAULT_LINK_OPTIONS: NonPartial<LinkOptions> = {
  ctrlClickToFollowLink: true,
  excludeAllMarks: true,
  withAnchorLinkHeading: false,
}

export const LINK_NAME = 'link' as const

/**
 * link(`<a>`) mark extension
 *
 * 인라인 link(인라인 요소)
 *
 * **plugins**
 *
 * - `ctrlClickToFollowLink` 기능을 적용하는 plugin
 *   - editor view 가 focus 된 상태에서 ctrl 키를 누른 경우 editor view dom에 'link-able' 클래스가 추가되며, 이를 이용해 관련 css를 적용할 수 있음
 */
export const Link = MarkExtension.create<
  MergeConfigMap<{
    name: typeof LINK_NAME
    commands: LinkCommands
    utils: LinkUtils
  }>,
  LinkOptions
>({
  name: LINK_NAME,
  priority: 52,
  options: {
    ...DEFAULT_LINK_OPTIONS,
  },
  extendProseMirrorBaseMarkSpec: {
    key: 'link',
    spec({ baseMarkSpec, options }) {
      const allowedAnchorLinkHeading =
        options?.withAnchorLinkHeading ?? DEFAULT_LINK_OPTIONS.withAnchorLinkHeading

      const linkParseRuleInHeading: ParseRule = {
        tag: 'a[href*="#"]',
        priority: 51,
        context: `${HEADING_NAME}/`,
        getAttrs(dom) {
          const href = dom.getAttribute('href')!.replace(RegExp(`^.*(?=#)`), '')

          if (allowedAnchorLinkHeading && !dom.textContent) {
            dom.textContent = ZERO_WIDTH_SPACE_UNICODE
          }

          return {
            href,
            title: '제목 링크로 이동',
          }
        },
      }

      const linkMarkSpec: ExtensionMarkSpec = {
        ...baseMarkSpec,
        ...((options?.excludeAllMarks ?? true) && { excludes: '_' }),
        attrs: {
          href: { validate: 'string' },
          title: { default: null, validate: 'string|null' },
          target: {
            default: null,
            validate(value) {
              if (value === null) return

              if (!VALID_LINK_TARGET.includes(value)) {
                throw Error(`${value} 는 유효한 target 값이 아닙니다`)
              }
            },
          },
        } as LinkAttributeSpecs,
        parseDOM: ((
          allowedAnchorLinkHeading: NonNullable<LinkOptions['withAnchorLinkHeading']>,
        ) => {
          const parseRule: ParseRule[] = [
            {
              tag: 'a[href]',
              getAttrs(dom) {
                const firstChildTagName = dom.firstElementChild?.tagName

                // `BlockLink` 노드가 적용되었을 경우 mark로 parse되서 적용되지 않도록 해야 함
                // 현재는 `BlockImage` 노드만 고려하였지만, 이후에 필요할 경우 조건을 추가해야 함
                if (firstChildTagName === 'IMG') return false

                return Link.utils.getLinkAttrs({ dom, allowedAnchorLinkHeading })
              },
            },
          ]

          if (allowedAnchorLinkHeading) {
            parseRule.push(linkParseRuleInHeading)
          }

          return parseRule
        })(allowedAnchorLinkHeading),
        toDOM(mark, inline, attributes) {
          const { href, title, target } = mark.attrs

          const isHeadingAnchorLink = href.startsWith('#')

          return [
            'a',
            {
              href,
              title,
              target,
              ...(isHeadingAnchorLink && {
                class: 'heading-anchor-link',
                draggable: 'false',
              }),
              ...attributes,
            },
            0,
          ]
        },
      }

      return linkMarkSpec
    },
  },
  commands({ markType, utils }) {
    return {
      setLink({ href, target, title }) {
        return (state, dispatch, view) => {
          if (utils.isActive()) return false

          const { empty } = state.selection

          return setMark({
            markType,
            attrs: utils.createAttrs({ href, target, title }),
            ...(empty && { text: href }),
          })(state, dispatch, view)
        }
      },
      unsetLink(state, dispatch, view) {
        if (!utils.isActive()) return false

        return unsetMark(markType, {
          removeTargetWhenEmpty: 'node',
        })(state, dispatch, view)
      },
      toggelLink(attrs) {
        return (state, dispatch, view) => {
          const blockLinkNodeType = state.schema.nodes[BLOCK_LINK_NAME]

          const inlineLinkIsActive = utils.isActive()
          const blockLinkIsActive = !!blockLinkNodeType && BlockLink.utils.isActive()

          if (inlineLinkIsActive) {
            return this.unsetLink(state, dispatch, view)
          }

          if (blockLinkIsActive) {
            return BlockLink.commands.unsetBlockLink(state, dispatch, view)
          }

          if (isNodeSelection(state.selection) && state.selection.node.isBlock) {
            return BlockLink.commands.setBlockLink(attrs)(state, dispatch, view)
          }

          return this.setLink(attrs)(state, dispatch, view)
        }
      },
    }
  },
  utils({ editor, markType }) {
    return {
      getLinkAttrs({ dom, allowedAnchorLinkHeading }) {
        const hasAnchorLink = (href: string | null) => {
          return !!href?.startsWith('#')
        }

        if (allowedAnchorLinkHeading) {
          const allowedHeadings =
            allowedAnchorLinkHeading === true
              ? Heading?.options?.levels?.length
                ? Heading.options.levels
                : DEFAULT_HEADING_OPTIONS.levels
              : allowedAnchorLinkHeading.headings

          let heading: HTMLHeadingElement | null = null

          for (const headingTagName of allowedHeadings) {
            if (heading) break

            heading = dom.closest(headingTagName)
          }

          if (heading && !dom.textContent) dom.textContent = ZERO_WIDTH_SPACE_UNICODE
        }

        const href = dom.getAttribute('href') || ''
        const getTarget = (targetAttribute: LinkTarget | null) => {
          if (!targetAttribute) {
            return hasAnchorLink(href) ? targetAttribute : '_blank'
          }

          return targetAttribute
        }

        return {
          href,
          title: dom.getAttribute('title'),
          target: getTarget(dom.getAttribute('target') as LinkTarget | null),
        }
      },
      createAttrs({ href, target = '_blank', title = null }) {
        return {
          href,
          target: target || '_blank',
          title: title || null,
        }
      },
      createAnchorLinkMark(hash) {
        return markType.create(
          this.createAttrs({ href: '#' + (hash ?? ''), target: null, title: '제목 링크로 이동' }),
        )
      },
      createAnchorLinkNode({ hash }) {
        const mark = this.createAnchorLinkMark(hash)

        return editor.state.schema.text(ZERO_WIDTH_SPACE_UNICODE, [mark])
      },
      anchorLinkMarkIsInSet(marks) {
        return (
          marks.find(
            (mark) => mark.type.name === markType.name && mark.attrs.href.startsWith('#'),
          ) ?? null
        )
      },
      isActive() {
        const { $from, $to, empty } = editor.state.selection

        if (empty) {
          return !!markType.isInSet(editor.state.storedMarks || $from.marks())
        }

        return editor.state.doc.rangeHasMark($from.pos, $to.pos, markType)
      },
    }
  },
  plugins({ options: { ctrlClickToFollowLink } }) {
    const plugins: Plugin[] = []

    if (ctrlClickToFollowLink) {
      const ctrlClickToFollowLinkPluginKey = new PluginKey<CtrlClickToFollowLinkPluginState>(
        `ctrlClickToFollowLink`,
      )

      const ctrlClickToFollowLinkPlugin = new Plugin({
        key: ctrlClickToFollowLinkPluginKey,
        state: {
          init() {
            return { pressedModKey: false }
          },
          apply(tr, value) {
            const stateValue = tr.getMeta(ctrlClickToFollowLinkPluginKey)

            if (!stateValue) return value

            return { ...stateValue }
          },
        },
        props: {
          attributes(state) {
            const pluginState = ctrlClickToFollowLinkPluginKey.getState(state)

            return {
              ...(pluginState?.pressedModKey && {
                class: 'link-able',
              }),
            }
          },
          handleClick(view, pos, event) {
            if (!view.editable) return

            const target = event.target as HTMLElement

            const link =
              target.tagName === 'A' ? (target as HTMLAnchorElement) : target.closest('a')

            if (!link) return
            if (this.getState(view.state)?.pressedModKey !== true) return

            const { href, target: targetAttribute } = link

            if (href.includes('/#')) {
              target.scrollIntoView({ behavior: 'smooth' })
            } else {
              const newWindow = window.open(
                href,
                targetAttribute ?? undefined,
                'noopener, noreferrer',
              )
              if (newWindow) newWindow.opener = null
            }

            view.dispatch(
              view.state.tr
                .setSelection(TextSelection.near(view.state.doc.resolve(pos)))
                .setMeta(ctrlClickToFollowLinkPluginKey, {
                  pressedModKey: false,
                } as CtrlClickToFollowLinkPluginState),
            )

            return true
          },
          handleKeyDown(view, event) {
            if (!view.editable) return

            const mod = event.ctrlKey || event.metaKey

            if (!mod) return

            const pluginState = this.getState(view.state)

            if (pluginState?.pressedModKey) return

            view.dispatch(
              view.state.tr.setMeta(ctrlClickToFollowLinkPluginKey, {
                pressedModKey: true,
              } as CtrlClickToFollowLinkPluginState),
            )
          },
          handleDOMEvents: {
            keyup(view) {
              if (!view.editable) return

              const pluginState = this.getState(view.state)

              if (!pluginState || pluginState?.pressedModKey !== true) return

              view.dispatch(
                view.state.tr.setMeta(ctrlClickToFollowLinkPluginKey, {
                  pressedModKey: false,
                } as CtrlClickToFollowLinkPluginState),
              )
            },
          },
        },
      })

      plugins.push(ctrlClickToFollowLinkPlugin)
    }

    return plugins
  },
})
