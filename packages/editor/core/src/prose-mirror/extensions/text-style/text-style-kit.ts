import { ExtensionCollection } from '../core/collection'
import { BackgroundColor } from './background-color'
import { FontColor } from './font-color'
import { FontSize } from './font-size'
import { TextStyle } from './text-style'

/**
 * [`TextStyle`, `FontColor`, `BackgroundColor`, `FontSize`]
 *
 * - text style 과 관련된 extension collection
 */
export const TextStyleKit = ExtensionCollection.from([
  TextStyle,
  FontColor,
  BackgroundColor,
  FontSize,
])
