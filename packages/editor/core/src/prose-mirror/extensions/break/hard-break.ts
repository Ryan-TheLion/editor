import { MergeConfigMap } from '../../../typing'
import { NodeExtension } from '../core'

export const HARD_BREAK_NAME = 'hard_break' as const

/**
 * 줄 바꿈(`<br>`) node extension
 */
export const HardBreak = NodeExtension.create<
  MergeConfigMap<{
    name: typeof HARD_BREAK_NAME
  }>
>({
  name: HARD_BREAK_NAME,
  extendProseMirrorBaseNodeSpec: {
    key: 'hard_break',
  },
})
