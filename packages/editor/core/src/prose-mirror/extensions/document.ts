import { MergeConfigMap } from '../../typing'
import { NodeExtension } from './core'

export const DOCUMENT_NAME = 'doc' as const

/**
 * doc node extension
 *
 * - topNode
 */
export const Document = NodeExtension.create<
  MergeConfigMap<{
    name: typeof DOCUMENT_NAME
  }>
>({
  name: DOCUMENT_NAME,
  priority: Infinity,
  topNode: true,
  extendProseMirrorBaseNodeSpec: {
    key: 'doc',
  },
})
