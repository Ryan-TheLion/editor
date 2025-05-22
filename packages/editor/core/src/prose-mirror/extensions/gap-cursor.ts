import { gapCursor } from 'prosemirror-gapcursor'

import { MergeConfigMap } from '../../typing'
import { Extension } from './core'

export const GAP_CURSOR_NAME = 'gap_cursor' as const

/**
 * gapcursor extension
 *
 * - `prosemirror-gapcursor` 플러그인
 */
export const GapCursor = Extension.create<
  MergeConfigMap<{
    name: typeof GAP_CURSOR_NAME
  }>
>({
  name: GAP_CURSOR_NAME,
  plugins() {
    return [gapCursor()]
  },
})
