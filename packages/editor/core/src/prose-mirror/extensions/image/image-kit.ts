import { ExtensionCollection } from '../core/collection'
import { BlockImage } from './block-image'
import { InlineImage } from './inline-image'

export const Images = ExtensionCollection.from([BlockImage, InlineImage])
