import { CodeEditor, CodeEditorDom, CodeEditorState } from '@devrun_ryan/code-editor-core'
import {
  firaCodeFont,
  lineHighlight,
  lineHighlightFields,
  scrollbar,
} from '@devrun_ryan/code-editor-core/extension'
import { isEqual } from 'lodash-es'
import { Node } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import { EditorView, NodeView } from 'prosemirror-view'

import { Editor } from '../../../editor'
import { NodeViewConstructorParams } from '../../../typing'
import { getNodeAttrs } from '../../utils'
import { CODE_BLOCK_LANGUAGES, CodeBlockAttrs } from './code-block-extension'

type CodeMirrorJSON<
  StateFields extends Parameters<CodeEditorState['toJSON']>[0],
  Options extends {
    extractStateFields: boolean
  },
> = Options['extractStateFields'] extends false
  ? {
      doc: any
      selection: { ranges: { anchor: number; head: number }[]; main: number }
    } & { [K in keyof StateFields]: any }
  : { [K in keyof StateFields]: any }

type Cleanup = () => void

type CodeBlockViewCleanup = Record<'editor' | 'cm', Cleanup | null>

/*
  [TODO]
  - 코드 에디터 라이브러리 수정이후 추가로 구현할 예정
    - ex. 코드 에디터 수정된 내용이 codemirror history가 아닌 prosemirror history 로 관리되도록 수정
*/

export class CodeBlockView implements NodeView {
  dom: CodeEditorDom
  node: Node

  editor: Editor
  cm: CodeEditor

  view: EditorView
  getPos: NodeViewConstructorParams['getPos']

  updating: boolean = false

  cleanup: CodeBlockViewCleanup = {
    editor: null,
    cm: null,
  }

  constructor({ node, view, getPos, editor }: NodeViewConstructorParams & { editor: Editor }) {
    this.view = view
    this.getPos = getPos

    this.node = node
    const nodeAttributes = this.getAttrs(node)

    this.editor = editor

    this.cm = new CodeEditor({
      content: this.initialContent(node),
      editable: view.editable,
      ...(nodeAttributes.language &&
        CODE_BLOCK_LANGUAGES.includes(nodeAttributes.language) && {
          language: nodeAttributes.language,
        }),
      extraExtensions: [firaCodeFont(), lineHighlight(), scrollbar({ horizontal: true })],
      extraFields: {
        ...lineHighlightFields,
      },
    })

    this.dom = this.cm.dom

    this.cleanup.editor = editor.subscribeUpdateListener(() => {
      if (this.cm.editable !== this.view.editable) {
        this.cm.setEditable(this.view.editable)
      }
    })

    this.cleanup.cm = this.cm.subscribeUpdateListener((update) => {
      if (!this.view.editable || !this.cm.editable) return

      this.cm.state = update.state

      if (!this.cm.view.hasFocus) return
      if (this.updating) return

      const stateFields = this.getCodeMirrorJSON({
        state: update.state,
        stateFields: lineHighlightFields,
        extractStateFields: true,
      })

      const diffStateFields = this.getDiffStateFields({
        stateFields,
      })

      const pos = this.getPos()
      if (typeof pos !== 'number') return

      let offset = pos + 1

      const { main } = update.state.selection
      const selection = {
        cm: {
          main: update.state.selection.main,
          from: offset + main.from,
          to: offset + main.to,
        },
        pm: this.view.state.selection,
      }

      const tr = this.view.state.tr

      if (diffStateFields) {
        tr.setNodeAttribute(pos, 'stateFields', diffStateFields)
      }

      if (
        update.docChanged ||
        selection.pm.from != selection.cm.from ||
        selection.pm.to != selection.cm.to
      ) {
        update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
          if (text.length)
            tr.replaceWith(offset + fromA, offset + toA, editor.state.schema.text(text.toString()))
          else tr.delete(offset + fromA, offset + toA)
          offset += toB - fromB - (toA - fromA)
        })

        tr.setSelection(TextSelection.create(tr.doc, selection.cm.from, selection.cm.to))

        this.view.dispatch(tr)

        return
      }

      if (tr.docChanged) {
        this.view.dispatch(tr)
      }
    })
  }

  update(node: Node) {
    if (node.type.name !== this.node.type.name) return false

    this.node = node

    const nodeAttributes = this.getAttrs(node)

    if (this.cm.language !== nodeAttributes.language) {
      this.cm.changeLanguage(nodeAttributes.language)
    }

    if (this.updating) return true

    const text = {
      cur: this.cm.state.doc.toString(),
      new: node.textContent,
    }

    if (text.cur !== text.new) {
      let start = 0
      let curEnd = text.cur.length
      let newEnd = text.new.length

      while (start < curEnd && text.cur.charCodeAt(start) === text.new.charCodeAt(start)) {
        ++start
      }

      while (
        curEnd > start &&
        newEnd > start &&
        text.cur.charCodeAt(curEnd - 1) === text.new.charCodeAt(newEnd - 1)
      ) {
        curEnd--
        newEnd--
      }

      this.updating = true

      this.cm.view.dispatch({
        changes: {
          from: start,
          to: curEnd,
          insert: text.new.slice(start, newEnd),
        },
      })

      this.updating = false
    }

    const tr = this.view.state.tr
    const pos = this.getPos()

    if (
      typeof pos === 'number' &&
      !isEqual(nodeAttributes.selection, this.cm.state.selection.toJSON())
    ) {
      tr.setNodeAttribute(pos, 'selection', this.cm.state.selection.toJSON())

      this.view.dispatch(tr)
    }

    return true
  }

  setSelection(anchor: number, head: number, root: Document | ShadowRoot) {
    if (!this.view.editable) return
    if (!this.cm.view.hasFocus) return

    this.cm.view.focus()
    this.updating = true

    this.cm.view.dispatch({ selection: { anchor, head } })

    this.updating = false
  }

  selectNode() {
    this.cm.view.focus()
  }

  ignoreMutation(mutation: MutationRecord) {
    if (!this.dom.contains(mutation.target)) return false

    return true
  }

  stopEvent(event: Event) {
    return true
  }

  destroy() {
    this.cleanup.editor?.()
    this.cleanup.cm?.()

    this.cm.view.destroy()
  }

  // custom code block view method

  getAttrs(node?: Node) {
    const codeBlockNode = node ?? this.node

    return getNodeAttrs<CodeBlockAttrs>(codeBlockNode)
  }

  getCodeText(node: Node) {
    if (node?.content?.childCount) {
      return node.content.child(0).textContent || ''
    }

    return ''
  }

  initialContent(node: Node) {
    const { selection, stateFields } = this.getAttrs(node)

    return {
      doc: this.getCodeText(node),
      selection: selection ?? { ranges: [{ anchor: 0, head: 0 }], main: 0 },
      ...stateFields,
    }
  }

  getCodeMirrorJSON<
    StateFields extends Parameters<CodeEditorState['toJSON']>[0],
    ExtractStateFields extends boolean = false,
  >({
    state,
    stateFields,
    extractStateFields,
  }: {
    state: CodeEditorState
    stateFields?: StateFields
    extractStateFields?: ExtractStateFields
  }): CodeMirrorJSON<StateFields, { extractStateFields: ExtractStateFields }> {
    const json = state.toJSON(stateFields)

    if (extractStateFields) {
      // eslint-disable-next-line no-unused-vars
      const { doc, selection, ...stateFields } = json

      return stateFields
    }

    return json
  }

  getDiffStateFields<StateFields extends NonNullable<Parameters<CodeEditorState['toJSON']>[0]>>({
    stateFields,
  }: {
    stateFields: StateFields
  }) {
    const nodeStateFields = this.getAttrs().stateFields

    const equal = Array.from(Object.keys(stateFields)).reduce(
      (acc, key) => {
        const stateField = stateFields[key]
        const nodeStateFieldAttr = nodeStateFields[key as keyof typeof nodeStateFields]

        return {
          ...acc,
          [key]: isEqual(stateField, nodeStateFieldAttr),
        }
      },
      {} as Record<string, boolean>,
    )

    const diff = Array.from(Object.values(equal)).some((_equal) => !_equal)

    if (!diff) return null

    return {
      ...stateFields,
    }
  }
}
