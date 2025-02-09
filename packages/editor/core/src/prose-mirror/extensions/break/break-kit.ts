import { ExtensionCollection } from '../core/collection'
import { HardBreak } from './hard-break'
import { SoftBreak } from './soft-break'

export const Break = ExtensionCollection.from([HardBreak, SoftBreak])
