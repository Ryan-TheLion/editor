import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  deleteSelection,
  joinBackward,
  liftEmptyBlock,
  newlineInCode,
  selectNodeBackward,
  splitBlock,
} from 'prosemirror-commands'
import { keydownHandler } from 'prosemirror-keymap'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'

import { EmptyExtensionConfigMap } from '../../typing'
import { Extension } from './core'

export const BASE_KEYMAP_NAME = 'base_keymap' as const

/**
 * base key map extension
 *
 * - 기존 extension의 key command를 먼저 실행하고, 실패할 경우 마지막에 base-keymap command를 실행
 *   - editor에서 init 할 때, extension 배열을 순회하면서 플러그인을 생성하기 때문에, extension의 priority를 1로 설정 해서 마지막에 basekeymap extension이 위치하도록 함
 *
 * **plugins**
 * - `prosemirror-commands` 의 baseKeymap
 */
export const BaseKeyMap = Extension.create<EmptyExtensionConfigMap<typeof BASE_KEYMAP_NAME>>({
  name: BASE_KEYMAP_NAME,
  priority: 1,
  plugins({ editor }) {
    const key = new PluginKey('base-keymap')

    const keymapPlugin = new Plugin({
      key,
      props: {
        handleKeyDown: keydownHandler({
          ...baseKeymap,
          Backspace: (state, dispatch, view) => {
            return chainCommands(deleteSelection, joinBackward, selectNodeBackward)(
              state,
              dispatch,
              view,
            )
          },
          Enter: (state, dispatch, view) => {
            const dryRunCommands = {
              newlineInCode: newlineInCode(state),
              createParagraphNear: createParagraphNear(state),
              liftEmptyBlock: liftEmptyBlock(state),
              splitBlock: splitBlock(state),
            }

            if (dryRunCommands.newlineInCode && dryRunCommands.splitBlock) {
              splitBlock(state, dispatch, view)

              const tr = editor.state.tr

              const $pos = tr.doc.resolve(tr.selection.$to.pos + 1)
              const selection = TextSelection.near($pos)
              tr.setSelection(selection)

              if (dispatch) {
                editor.view.dispatch(tr)
              }

              return true
            }

            return chainCommands(createParagraphNear, liftEmptyBlock, splitBlock)(
              state,
              dispatch,
              view,
            )
          },
        }),
      },
    })

    return [keymapPlugin]
  },
})
