import { TableRole } from 'prosemirror-tables'

import { MergeConfigMap } from '../../../typing'
import { NodeExtension } from '../core'
import { TABLE_CELL_NAME } from './cell'
import { TABLE_HEADER_NAME } from './header'

export const TABLE_ROW_NAME = 'table_row' as const

/** `TableRow` 노드의 `tableRole` 속성 값 */
export const TABLE_ROW_TABLE_ROLE: TableRole = 'row' as const

/**
 * table row(`<tr>`) node extension
 */
export const TableRow = NodeExtension.create<MergeConfigMap<{ name: typeof TABLE_ROW_NAME }>>({
  name: TABLE_ROW_NAME,
  nodeSpec() {
    return {
      content: `(${TABLE_CELL_NAME} | ${TABLE_HEADER_NAME})*`,
      tableRole: TABLE_ROW_TABLE_ROLE,
      parseDOM: [{ tag: 'tr' }],
      toDOM() {
        return ['tr', 0]
      },
    }
  },
})
