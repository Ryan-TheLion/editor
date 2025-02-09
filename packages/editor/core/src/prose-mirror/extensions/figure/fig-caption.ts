import { Node } from 'prosemirror-model'
import { Command, Plugin, PluginKey, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { MergeConfigMap, ProsemirrorKeyboard } from '../../../typing'
import {
  ContentChildList,
  insertNewLineAtNextBlock,
  nextLineNode,
  PROSEMIRROR_KEYBOARD,
  summarizeSelection,
} from '../../utils'
import { HARD_BREAK_NAME, SoftBreak } from '../break'
import { NodeExtension } from '../core'
import { Paragraph } from '../paragraph'

type FigCaptionShortcutKeys = ProsemirrorKeyboard['Enter']

export type FigCaptionShortcut = Record<FigCaptionShortcutKeys, Command>

export const FIG_CAPTION_NAME = 'fig_caption' as const

/**
 * figcaption(`<figcaption>`) node extension
 *
 * **shortcut**
 * - `Enter`
 *   - figcaption에서 Enter 키 입력 시
 *     - (figcaption 내 콘텐츠가 있고, 현재 비어있는 라인에 커서가 위치하지 않은 경우) soft break
 *     - (콘텐츠가 없거나, 비어있는 라인에 커서가 위치한 경우) 에디터 다음 라인으로 이동(다음 라인이 없을 경우 생성후 이동)
 *
 * **plugin**
 * - figcaption placeholder
 *   - figcaption 콘텐츠(텍스트)가 없을 경우 placeholder 렌더링
 *   - editable: false 인 경우에는 placeholder 렌더링 하지 않음
 */
export const FigCaption = NodeExtension.create<
  MergeConfigMap<{
    name: typeof FIG_CAPTION_NAME
    shortcut: FigCaptionShortcut
  }>
>({
  name: FIG_CAPTION_NAME,
  nodeSpec() {
    return {
      group: 'figcaption',
      inline: false,
      content: 'inline*',
      parseDOM: [
        {
          tag: 'figcaption',
        },
      ],
      toDOM() {
        return ['figcaption', 0]
      },
    }
  },
  shortcut({ nodeType }) {
    const keys = {
      focusNextNodeOrInsertLine: PROSEMIRROR_KEYBOARD['Enter'],
    } as const

    return {
      [keys.focusNextNodeOrInsertLine]: (state, dispatch, view) => {
        const {
          from,
          $from,
          empty,
          figCaptionNode,
          emptyFigCaption,
          cursorAtLastFigCaptionEmptyLine,
        } = summarizeSelection(state.selection, ({ resolvedPos, summerizedSelection }) => {
          const empty = summerizedSelection.empty

          const figCaptionNode =
            summerizedSelection.from.parentNode.type.name === nodeType.name
              ? summerizedSelection.from.parentNode
              : null

          const lastEmptyLine = (pos: number) => {
            let lastEmptyLinePos: number | null = null

            figCaptionNode?.content.descendants((node, pos, parent, index) => {
              if (index < figCaptionNode.childCount - 1) return
              if (node.type.name !== HARD_BREAK_NAME) return

              lastEmptyLinePos = pos
            })

            if (lastEmptyLinePos === null) return false

            return summerizedSelection.from.parentStart + lastEmptyLinePos + 1 === pos
          }

          const cursorAtFigCaptionEmptyLine =
            empty && !!figCaptionNode && summerizedSelection.from.node.type.name === HARD_BREAK_NAME

          return {
            $from: resolvedPos.$from,
            figCaptionNode,
            emptyFigCaption: !!figCaptionNode && !figCaptionNode.content.childCount,
            cursorAtLastFigCaptionEmptyLine:
              cursorAtFigCaptionEmptyLine && lastEmptyLine(summerizedSelection.from.pos),
          }
        })

        if (!empty) return false
        if (!figCaptionNode) return false

        if (dispatch) {
          if (emptyFigCaption) {
            const tr = state.tr

            const nextNode = nextLineNode({ state })

            if (!nextNode || !Paragraph.utils.isParagraphNode(nextNode)) {
              dispatch(insertNewLineAtNextBlock({ state, tr, focusLine: true }))

              return true
            }

            const $near = state.doc.resolve($from.end() + 1)

            tr.setSelection(TextSelection.near($near))

            dispatch(tr)

            return true
          }

          if (cursorAtLastFigCaptionEmptyLine) {
            const tr = state.tr

            tr.replaceWith(
              from.parentStart,
              from.parentEnd,
              ContentChildList.from(figCaptionNode).filter(
                (node, index) => index < figCaptionNode.childCount - 1,
              ),
            )

            const nextNode = nextLineNode({ state })

            if (!nextNode || !Paragraph.utils.isParagraphNode(nextNode)) {
              dispatch(insertNewLineAtNextBlock({ state: state.apply(tr), tr, focusLine: true }))

              return true
            }

            const $near = tr.doc.resolve($from.end() + 1)
            tr.setSelection(TextSelection.near($near))

            dispatch(tr)

            return true
          }

          return SoftBreak.commands.softBreak(state, dispatch, view)
        }

        return true
      },
    }
  },
  plugins({ editor, nodeType }) {
    const pluginKey = new PluginKey<DecorationSet>(`${FIG_CAPTION_NAME}-plugin`)

    const placeholder = () => {
      const element = document.createElement('div')
      element.className = 'caption-placeholder'
      element.textContent = '설명을 입력해주세요'

      return element
    }

    const figCaptionPlaceholderSet = ({ doc }: { doc: Node }) => {
      let set = DecorationSet.empty

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (node.type.name !== nodeType.name) return
        if (node.textContent) return

        set = set.add(doc, [Decoration.widget(pos + 1, placeholder())])
      })

      return set
    }

    const plugin = new Plugin({
      key: pluginKey,
      state: {
        init(config, instance) {
          if (!editor.config.editable) {
            return DecorationSet.empty
          }

          return figCaptionPlaceholderSet({ doc: instance.doc })
        },
        apply(tr) {
          if (!editor.view.editable) return DecorationSet.empty

          return figCaptionPlaceholderSet({ doc: tr.doc })
        },
      },
      props: {
        decorations(state) {
          if (editor?.editable !== undefined && !editor.editable) return DecorationSet.empty

          return this.getState(state)
        },
      },
    })

    return [plugin]
  },
})
