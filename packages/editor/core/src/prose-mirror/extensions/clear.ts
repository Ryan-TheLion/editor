import { Slice } from 'prosemirror-model'
import { Command, Plugin, PluginKey, Selection } from 'prosemirror-state'

import { MergeConfigMap } from '../../typing'
import { maybeEmptyNode } from '../utils'
import { Extension } from './core'
import { Paragraph } from './paragraph'

interface ClearCommands {
  /** 에디터 콘텐츠를 빈 텍스트(paragraph)로 초기화 */
  clear: Command
}

interface ClearOptions {
  /**
   * 에디터 콘텐츠가 없을 경우 자동으로 빈 Paragraph 노드로 변환할지 유무
   * - 기본값 `true`
   */
  clearWhenEmpty?: boolean
}

export const CLEAR_NAME = 'clear' as const

/**
 * clear extension
 *
 * - `clearWhenEmpty` 옵션을 `true`로 설정할 경우,
 *   수정 이후 에디터 콘텐츠가 없을 때 Paragraph노드가 아닌 경우
 *   빈 Paragraph 노드로 변환
 * - `Placeholder` extension 을 적용했을 경우, 빈 Paragraph 노드로 변환된 이후 placeholder 문자열 표시
 */
export const Clear = Extension.create<
  MergeConfigMap<{
    name: typeof CLEAR_NAME
    commands: ClearCommands
  }>,
  ClearOptions
>({
  name: 'clear',
  options: {
    clearWhenEmpty: true,
  },
  commands() {
    return {
      clear(state, dispatch, view) {
        if (view && !view.editable) return false

        if (maybeEmptyNode(state.doc)) return false

        if (dispatch) {
          const tr = state.tr

          tr.replaceRange(0, Selection.atEnd(state.doc).$to.pos, Slice.empty)

          dispatch(tr)
        }

        return true
      },
    }
  },
  plugins({ options = { clearWhenEmpty: true } }) {
    if (!options?.clearWhenEmpty) return []

    const key = new PluginKey(`${CLEAR_NAME}Plugin`)

    const clearPlugin = new Plugin({
      key,
      appendTransaction(transactions, oldState, newState) {
        const docIsMaybeEmpty = maybeEmptyNode(newState.doc)

        if (!docIsMaybeEmpty) return null

        if (newState.doc?.firstChild?.type.name === Paragraph.nodeType.name) return null

        return newState.tr.replaceWith(
          0,
          newState.doc.firstChild!.nodeSize,
          Paragraph.nodeType.create(),
        )
      },
    })

    return [clearPlugin]
  },
})
