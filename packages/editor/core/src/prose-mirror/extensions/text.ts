import { MergeConfigMap } from '../../typing'
import { NodeExtension } from './core'

export const TEXT_NAME = 'text' as const

/**
 * text node extension
 */
export const Text = NodeExtension.create<
  MergeConfigMap<{
    name: typeof TEXT_NAME
  }>
>({
  name: TEXT_NAME,
  priority: Infinity,
  extendProseMirrorBaseNodeSpec: {
    key: 'text',
  },
})
