import { ExtensionCollection } from '../core/collection'
import { BulletList } from './bullet-list'
import { ListItem } from './list-item'
import { OrderedList } from './ordered-list'

/**
 * [`ListItem`, `OrderedList`, `BulletList`]
 *
 * - 리스트와 관련된 extension collection
 */
export const List = ExtensionCollection.from([ListItem, OrderedList, BulletList])
