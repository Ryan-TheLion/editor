import { toggleMark } from 'prosemirror-commands'
import { Command } from 'prosemirror-state'

import {
  CombineProsemirrorKeys,
  KeyBinding,
  MergeConfigMap,
  ProsemirrorKeyboard,
} from '../../../typing'
import {
  combineProsemirrorKeys,
  isTextSelection,
  PROSEMIRROR_KEYBOARD,
  setMark,
  unsetMark,
} from '../../utils'
import { MarkExtension } from '../core'

export interface InlineCodeCommands {
  /** 인라인 코드 mark 설정 */
  setInlineCode: Command
  /**
   * 인라인 코드 mark 해제
   * - 범위 선택없이 커서로 위치한 상태에서 unset 후 바로 텍스트 입력시 일반 텍스트로 취급
   * - ex)
   * `co|de` => (unset, input text) => `co`text`de`
   */
  unsetInlineCode: Command
  /** 인라인 코드 mark가 있을 경우 해당 mark 삭제, 없을 경우 인라인 코드 mark 삽입 */
  toggleInlineCode: Command
}

type InlineCodeShortcutKeys =
  | ProsemirrorKeyboard['ArrowRight']
  | CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'e']>

export interface InlineCodeShortcut extends Record<InlineCodeShortcutKeys, Command>, KeyBinding {}

export const INLINE_CODE_NAME = 'inline_code' as const

/**
 * inline code (`<code>`) mark extension
 *
 * **shortcut**
 * - `Mod` + `e`
 *   - `toggleInlineCode`
 * - `ArrowRight`
 *   - 커서가 인라인 코드 mark의 끝지점인 상태에서 오른쪽 화살표 키 입력시 after 노드가 없을 경우 공백(" ")을 삽입
 */
export const InlineCode = MarkExtension.create<
  MergeConfigMap<{
    name: typeof INLINE_CODE_NAME
    commands: InlineCodeCommands
    shortcut: InlineCodeShortcut
  }>
>({
  name: INLINE_CODE_NAME,
  markSpec() {
    return {
      excludes: '_',
      spanning: false,
      parseDOM: [
        {
          tag: 'code',
          consuming: false,
          getAttrs(dom) {
            if (dom.parentElement?.tagName === 'PRE') return false

            return {}
          },
        },
      ],
      toDOM() {
        return ['code', 0]
      },
    }
  },
  commands({ markType }) {
    return {
      setInlineCode: setMark({ markType }),
      unsetInlineCode: unsetMark(markType),
      toggleInlineCode: toggleMark(markType),
    }
  },
  shortcut({ markType }) {
    const keys = {
      toggleInlineCode: combineProsemirrorKeys('⌘', 'e'),
      arrowRight: PROSEMIRROR_KEYBOARD.ArrowRight,
    } as const

    return {
      [keys.toggleInlineCode]: toggleMark(markType),
      [keys.arrowRight]: (state, dispatch, view) => {
        /*
          `code|` 에서 '->' 키 입력시 다음 노드가 없을 경우 ' ' (공백) 추가
          (|는 커서 위치)
        */

        if (!isTextSelection(state.selection)) return false

        const { $cursor, empty } = state.selection

        if (!empty || !$cursor) return false

        const hasCodeMark = markType.isInSet($cursor.marks())
        if (!hasCodeMark) return false

        const prevCursorHasCodeMark = markType.isInSet($cursor.nodeBefore?.marks ?? [])
        const nextCursorHasCodeMark = markType.isInSet($cursor.nodeAfter?.marks ?? [])

        const atEndOfCodeMark = !!prevCursorHasCodeMark && !nextCursorHasCodeMark
        if (!atEndOfCodeMark) return false
        if ($cursor.nodeAfter) return false

        dispatch?.(state.tr.insert($cursor.pos, state.schema.text(' ')))

        return true
      },
    }
  },
})
