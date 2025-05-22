import { CODE_MIRROR_EDITOR_DEFAULT_LANGUAGE } from '@devrun_ryan/code-editor-core'
import { Node } from 'prosemirror-model'
import { Command, EditorState, NodeSelection, Plugin, PluginKey } from 'prosemirror-state'

import { MergeConfigMap, TypedAttributeSpecs } from '../../../typing'
import { insertNewLineAtNextBlock, maybeEmptyNode } from '../../utils'
import { NodeExtension } from '../core'
import { CodeBlockView } from './code-block-view'

/**
 * CodeBlock 노드 attrs
 *
 * ```ts
 * {
 *   language,
 *   selection,
 *   stateFields
 * }
 * ```
 */
export interface CodeBlockAttrs {
  /** code editor(codemirror) 에서 사용 가능한 언어 (ex. `javascript`) */
  language: string
  /** (codemirror json 콘텐츠로 초기화 시) selection을 적용하기 위한 json 값 */
  selection: any
  /**
   * (codemirror json 콘텐츠로 초기화 시) stateFields를 적용하기 위한 json 값
   * - stateFields 를 활용해서 만든 플러그인을 위해 필요
   */
  stateFields: Record<string, any>
}

export const CODE_BLOCK_LANGUAGES = ['javascript', 'typescript', 'jsx', 'tsx']

/** code block `node spec` attrs */
export type CodeBlockAttributeSpecs = TypedAttributeSpecs<CodeBlockAttrs>

export interface CodeBlockCommands {
  insertCodeBlock: Command
  deleteCodeBlock: Command
  setLanguage: (language: string) => Command
}

export interface CodeBlockUtils {
  /** 코드블럭 내에 있는지 유무를 반환 */
  isInCodeBlock: (state: EditorState) => boolean
  /** selection 내의 코드블럭 노드를 반환 */
  findCodeBlockInSelection: (state: EditorState) => { node: Node; pos: number } | null
}

export const CODE_BLOCK_NAME = 'code_block' as const

// TODO: 코드 에디터 라이브러리를 수정한 뒤 추가로 구현 예정
export const CodeBlock = NodeExtension.create<
  MergeConfigMap<{
    name: typeof CODE_BLOCK_NAME
    commands: CodeBlockCommands
    utils: CodeBlockUtils
  }>
>({
  name: CODE_BLOCK_NAME,
  extendProseMirrorBaseNodeSpec: {
    key: 'code_block',
    spec({ baseNodeSpec }) {
      return {
        ...baseNodeSpec,
        attrs: {
          language: {
            default: CODE_MIRROR_EDITOR_DEFAULT_LANGUAGE,
            validate(value) {
              if (CODE_BLOCK_LANGUAGES.includes(value)) return

              throw new Error(`${value}는 유효한 code block language 속성 값이 아닙니다`)
            },
          },
          selection: {
            default: null,
          },
          stateFields: {
            default: {},
          },
        } satisfies CodeBlockAttributeSpecs,
      }
    },
  },
  commands({ editor, nodeType, utils }) {
    return {
      insertCodeBlock(state, dispatch, view) {
        const { $from, $to } = state.selection

        const fromNode = $from.node()
        const toNode = $to.node()

        if (
          fromNode.type.name === nodeType.name &&
          toNode.type.name === nodeType.name &&
          fromNode.eq(toNode)
        )
          return false

        const tr = state.tr
        const codeBlock = nodeType.create()

        maybeEmptyNode(state.doc) ? tr.insert(0, codeBlock) : tr.replaceSelectionWith(codeBlock)

        const diffStart = state.doc.content.findDiffStart(tr.doc.content)

        if (diffStart === null) return false

        if (dispatch) {
          const selection = NodeSelection.create(tr.doc, diffStart)
          tr.setSelection(selection)

          const $codeBlock = tr.doc.resolve(diffStart + codeBlock.nodeSize)
          const nextNode = $codeBlock.nodeAfter

          if (!nextNode) {
            insertNewLineAtNextBlock({ tr, state })
          }

          dispatch(tr)
        }

        return true
      },
      deleteCodeBlock(state, dispatch, view) {
        if ((view ?? editor.view).editable === false) return false

        const codeBlock = utils.findCodeBlockInSelection(state)

        if (!codeBlock) return false

        const from = codeBlock.pos
        const to = codeBlock.pos + codeBlock.node.nodeSize

        if (dispatch) {
          const tr = state.tr

          tr.delete(from, to)

          dispatch(tr)
        }

        return true
      },
      setLanguage(language) {
        return (state, dispatch, view) => {
          const { empty } = state.selection

          if (!empty) return false

          const codeBlock = utils.findCodeBlockInSelection(state)

          if (!codeBlock) return false

          const node = codeBlock.node
          const pos = codeBlock.pos

          if (language === (node.attrs as CodeBlockAttrs).language) return false

          if (dispatch) {
            const tr = state.tr

            tr.setNodeAttribute(pos, 'language', language)

            dispatch(tr)
          }

          return true
        }
      },
    }
  },
  utils({ nodeType }) {
    return {
      isInCodeBlock(state) {
        const $head = state.selection.$head

        for (let depth = $head.depth; depth > 0; depth--) {
          if ($head.node(depth).type.name === nodeType.name) return true
        }

        return false
      },
      findCodeBlockInSelection(state) {
        if (!this.isInCodeBlock(state)) return null

        const { $head } = state.selection

        for (let depth = $head.depth; depth > 0; depth--) {
          const node = $head.node(depth)

          if (node.type.name === nodeType.name) {
            return { node, pos: $head.before(depth) }
          }
        }

        return null
      },
    }
  },
  plugins({ editor }) {
    const key = new PluginKey('code-block-plugin')

    const plugin = new Plugin({
      key,
      props: {
        nodeViews: {
          [CODE_BLOCK_NAME]: (node, view, getPos, decorations, innerDecorations) =>
            new CodeBlockView({ node, view, getPos, decorations, innerDecorations, editor }),
        },
        handleDOMEvents: {
          focus: (view, event) => {
            const codeBlock = CodeBlock.utils.findCodeBlockInSelection(view.state)

            if (!codeBlock) return

            const tr = view.state.tr

            // code block view: setSelection => cm focus
            tr.setSelection(NodeSelection.create(view.state.doc, codeBlock.pos))

            view.dispatch(tr)
          },
        },
      },
    })

    return [plugin]
  },
})
