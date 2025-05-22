import { ExtensionCollection } from '../core/collection'
import { Table } from '.'
import { TableCell } from './cell'
import { TableHeader } from './header'
import { TableRow } from './row'

/**
 * [`TableCell`, `Table`, `TableHeader`, `TableRow`]
 * - 테이블과 관련된 extension collection
 */
export const Tables = ExtensionCollection.from([TableCell, Table, TableHeader, TableRow])
