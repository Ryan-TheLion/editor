import { wrapIn } from 'prosemirror-commands'
import { Command, NodeSelection } from 'prosemirror-state'

import { MergeConfigMap } from '../../../typing'
import { matchParent } from '../../utils'
import { NodeExtension } from '../core'
import { FIGURE_NAME } from '../figure'
import {
  CreateLinkAttrsParam,
  Link,
  LinkAttributeSpecs,
  LinkAttrs,
  LinkUtils,
  VALID_LINK_TARGET,
} from './link'

export interface BlockLinkCommands {
  /**
   * - link node 설정 (선택된 노드는 link노드의 자식, `<a><img /></a>` 와 같은 구조)
   * - NodeSelection 의 node를 대상으로 함
   */
  setBlockLink: (attrs: CreateLinkAttrsParam) => Command
  /** link node 해제 */
  unsetBlockLink: Command
  /** NodeSelection의 node 가 link node 인 경우 link node의 content로 대체, 적용되있지 않은 경우 link node로 설정 */
  toggleBlockLink: (attrs: CreateLinkAttrsParam) => Command
}

export interface BlockLinkUtils {
  /** link node attrs 생성을 도와주는 유틸 함수 */
  createAttrs: (attrs: CreateLinkAttrsParam) => LinkAttrs
  /** link node 가 적용되었는지 반환 */
  isActive: () => boolean
}

export const BLOCK_LINK_NAME = 'block_link' as const

/**
 * block link node extension
 *
 * 블록 link(블록 요소)
 *
 * - link (`<a>`) node extension
 *   - `Link` mark extension은 인라인(텍스트) 노드에 적용되고, `BlockLink` node extension은 블럭 노드에 적용
 *   - `BlockImage` 노드의 링크를 위해 사용
 *     - ex. `<figure><a><img ... /></a><figcaption></figcaption></figure>`
 *   - `Link` mark extension을 적용해서 `ctrlClickToFollowLink` 기능 사용 가능
 */
export const BlockLink = NodeExtension.create<
  MergeConfigMap<{
    name: typeof BLOCK_LINK_NAME
    commands: BlockLinkCommands
    utils: BlockLinkUtils
  }>
>({
  name: BLOCK_LINK_NAME,
  nodeSpec() {
    return {
      group: 'block',
      content: 'block',
      inline: false,
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
      parseDOM: [
        {
          tag: 'a[href]',
          context: `${FIGURE_NAME}/`,
          consuming: false,
          getAttrs: (dom) => {
            const linkUtils = Link.utils as LinkUtils

            return linkUtils.getLinkAttrs({ dom, allowedAnchorLinkHeading: false })
          },
        },
      ],
      toDOM(node) {
        const { href, target, title } = node.attrs as LinkAttrs

        return [
          'a',
          {
            href,
            target,
            title,
          },
          0,
        ]
      },
    }
  },
  commands({ nodeType, utils }) {
    return {
      setBlockLink({ href, target, title }) {
        return (state, dispatch, view) => {
          if (!href) return false

          return wrapIn(nodeType, utils.createAttrs({ href, target, title }))(state, dispatch, view)
        }
      },
      unsetBlockLink(state, dispatch, view) {
        const selection = state.selection

        const blockLink = matchParent(selection.$from, (node) => node.type.name === nodeType.name)

        if (!blockLink) return false

        if (dispatch) {
          const tr = state.tr

          const from = blockLink.pos
          const to = from + blockLink.node.nodeSize

          tr.replaceWith(from, to, blockLink.node.content)
          // maintain focus
          tr.setSelection(NodeSelection.create(tr.doc, from))

          dispatch(tr)
        }

        return true
      },
      toggleBlockLink(attrs) {
        return (state, dispatch, view) => {
          if (utils.isActive()) {
            return this.unsetBlockLink(state, dispatch, view)
          }

          return this.setBlockLink(attrs)(state, dispatch, view)
        }
      },
    }
  },
  utils({ editor, nodeType }) {
    return {
      createAttrs(attrs) {
        const linkUtils = Link.utils as LinkUtils

        return linkUtils.createAttrs(attrs)
      },
      isActive() {
        const selection = editor.state.selection

        const matched = matchParent(selection.$from, (node) => node.type.name === nodeType.name)

        if (matched) return true

        return false
      },
    }
  },
})
