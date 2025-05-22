import { Node } from 'prosemirror-model'
import {
  columnIsHeader,
  rowIsHeader,
  TableMap,
  TableRole,
  toggleHeader,
  toggleHeaderCell,
  toggleHeaderColumn,
  toggleHeaderRow,
} from 'prosemirror-tables'

import { MergeConfigMap } from '../../../typing'
import { NodeExtension } from '../core'
import { TableCell, TableCellOptions } from './cell'
import { Table } from './table'

export interface TableHeaderCommand {
  /**
   * - `prosemirror-tables` 메소드
   * - Toggles between row/column header and normal cells (Only applies to first row/column). For deprecated behavior pass useDeprecatedLogic in options with true.
   */
  toggleHeader: typeof toggleHeader
  /**
   * - `prosemirror-tables` 메소드
   * - Toggles whether the selected cells are header cells.
   */
  toggleHeaderCell: typeof toggleHeaderCell
  /**
   * - `prosemirror-tables` 메소드
   * - Toggles whether the selected row contains header cells.
   */
  toggleHeaderRow: typeof toggleHeaderRow
  /**
   * - `prosemirror-tables` 메소드
   * - Toggles whether the selected column contains header cells.
   */
  toggleHeaderColumn: typeof toggleHeaderColumn
}

export interface TableHeaderUtils {
  /** `row` 번째 행이 header 인지 유무 (0부터 시작)  */
  rowIsHeader: (table: Node, row: number) => boolean
  /** `col` 번째 열이 header 인지 유무 (0부터 시작) */
  columnIsHeader: (table: Node, col: number) => boolean
}

export const TABLE_HEADER_NAME = 'table_header' as const

/** `TableHeader` 노드의 `tableRole` 속성 값 */
export const TABLE_HEADER_TABLE_ROLE: TableRole = 'header_cell' as const

/**
 * table header(`<th>`) node extension
 */
export const TableHeader = NodeExtension.create<
  MergeConfigMap<{
    name: typeof TABLE_HEADER_NAME
    commands: TableHeaderCommand
    utils: TableHeaderUtils
  }>,
  TableCellOptions
>({
  name: TABLE_HEADER_NAME,
  options: {
    cellContent: 'block+',
  },
  nodeSpec({ editor, options }) {
    return {
      ...TableCell.config.nodeSpec!({ editor, options }),
      tableRole: TABLE_HEADER_TABLE_ROLE,
      parseDOM: [
        {
          tag: 'th',
          getAttrs(dom) {
            return TableCell.utils.getAttrs(dom, options?.cellAttributes)
          },
        },
      ],
      toDOM(node) {
        return ['th', TableCell.utils.setAttrs(node, options?.cellAttributes), 0]
      },
    }
  },
  commands() {
    return {
      toggleHeader,
      toggleHeaderRow,
      toggleHeaderCell,
      toggleHeaderColumn,
    }
  },
  utils() {
    return {
      rowIsHeader(table, row) {
        if (row < 0) return false
        if (!Table.utils.isTableNode(table)) return false

        return rowIsHeader(TableMap.get(table), table, row)
      },
      columnIsHeader(table, col) {
        if (col < 0) return false
        if (!Table.utils.isTableNode(table)) return false

        return columnIsHeader(TableMap.get(table), table, col)
      },
    }
  },
})
