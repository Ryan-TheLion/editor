import { AttributeSpec, Attrs, Node, ResolvedPos } from 'prosemirror-model'
import { Command, TextSelection } from 'prosemirror-state'
import {
  cellAround,
  CellAttributes,
  cellNear,
  CellSelection,
  deleteCellSelection,
  findCell,
  goToNextCell,
  mergeCells,
  moveCellForward,
  nextCell,
  pointsAtCell,
  setCellAttr,
  splitCell,
  splitCellWithType,
  TableRole,
} from 'prosemirror-tables'
import { EditorView } from 'prosemirror-view'

import { MergeConfigMap } from '../../../typing'
import { NodeExtension } from '../core'
import { Axis, TABLE_DIRECTION, TableDirectionKey } from '.'

export type TableCellAttrsKey = 'colspan' | 'rowspan' | 'colwidth'

export interface TableCellAttrs extends Record<TableCellAttrsKey, AttributeSpec> {}

export interface TableCellCommand {
  /** 다음 cell(dir "AFTER"), 이전 cell(dir "BEFORE") 로 이동 */
  goToNextCell: (dir: TableDirectionKey) => Command
  /**
   * - `prosemirror-tables` 메소드
   * - Returns a command that sets the given attribute to the given value, and is only available when the currently selected cell doesn't already have that attribute set to that value.
   */
  setCellAttr: typeof setCellAttr
  /**
   * - `prosemirror-tables` 메소드
   * - Merge the selected cells into a single cell. Only available when the selected cells' outline forms a rectangle.
   */
  mergeCells: typeof mergeCells
  /**
   * - `prosemirror-tables` 메소드
   * - Split a selected cell, whose rowpan or colspan is greater than one, into smaller cells. Use the first cell type for the new cells.
   */
  splitCell: typeof splitCell
  /**
   * - `prosemirror-tables` 메소드
   * - Split a selected cell, whose rowpan or colspan is greater than one, into smaller cells with the cell type (th, td) returned by getType function.
   */
  splitCellWithType: typeof splitCellWithType
  /**
   * - `prosemirror-tables` 메소드
   * - Deletes the content of the selected cells, if they are not empty.
   */
  deleteCellSelection: typeof deleteCellSelection
}

export interface TableCellUtils {
  /** dom 에서 table 노드와 관련된 속성을 추출 */
  getAttrs: (dom: HTMLElement, cellAttributes?: Record<string, CellAttributes>) => Attrs
  /** node 에 cellAttributes 와 관련된 속성을 설정 */
  setAttrs: (node: Node, cellAttributes?: Record<string, CellAttributes>) => Attrs
  /** Axis("horiz" | "vert") 의 dir("AFTER" | "BEFORE") 에 해당하는 cell이 끝나는 pos  */
  atEndOfCell: (axis: Axis, dir: TableDirectionKey, view?: EditorView) => number | null
  /**
   * 해당하는 cell의 resolvedPos
   * |                  | **dir** "AFTER" | **dir** "BEFORE" |
   * |------------------|-----------------|------------------|
   * | **axis** "horiz" | 현재 cell에 오른쪽에 해당하는 cell | 현재 cell의 왼쪽에 해당하는 cell |
   * | **axis** "vert"  | 현재 cell의 위에 해당하는 cell    | 현재 cell의 아래에 해당하는 cell  |
   */
  nextCell: ($pos: ResolvedPos, axis: Axis, dir: TableDirectionKey) => ResolvedPos | null
  /** `prosemirror-tables` 의 `findCell` 메소드 */
  findCellRect: typeof findCell
  /** `prosemirror-tables` 메소드 */
  moveCellForward: typeof moveCellForward
  /** `prosemirror-tables` 메소드 */
  pointsAtCell: typeof pointsAtCell
  /** `prosemirror-tables` 메소드 */
  cellNear: typeof cellNear
  /**`prosemirror-tables` 메소드 */
  cellAround: typeof cellAround
}

export interface TableCellOptions {
  /**
   * cell 노드에 적용할 content 타입
   * - 기본 값 `block+`
   */
  cellContent?: string
  /** `colspan`, `rowspan`, `colwidth` 외 cell 노드에 추가로 적용하고 싶은 attrs */
  cellAttributes?: Record<string, CellAttributes>
}

export const TABLE_CELL_NAME = 'table_cell' as const

/** `TableCell` 노드의 `tableRole` 속성 값 */
export const TABLE_CELL_TABLE_ROLE: TableRole = 'cell' as const

/** table cell(`<td>`) node extension */
export const TableCell = NodeExtension.create<
  MergeConfigMap<{
    name: typeof TABLE_CELL_NAME
    commands: TableCellCommand
    utils: TableCellUtils
  }>,
  TableCellOptions
>({
  name: TABLE_CELL_NAME,
  options: {
    cellContent: 'block+',
  },
  nodeSpec({ options }) {
    const extraCellAttrs: Record<string, AttributeSpec> | null = options.cellAttributes
      ? Array.from(Object.entries(options.cellAttributes)).reduce(
          (extra, [key, attr]) => {
            return {
              ...extra,
              [key]: { default: attr.default },
            }
          },
          {} as Record<string, AttributeSpec>,
        )
      : null

    const cellAttrs: TableCellAttrs = {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
      ...(options.cellAttributes && { ...extraCellAttrs }),
    }

    return {
      content: options.cellContent ?? 'block+',
      attrs: cellAttrs,
      tableRole: TABLE_CELL_TABLE_ROLE,
      isolating: true,
      parseDOM: [
        {
          tag: 'td',
          getAttrs(dom) {
            return getAttrs(dom, options?.cellAttributes)
          },
        },
      ],
      toDOM(node) {
        return ['td', setAttrs(node, options?.cellAttributes), 0]
      },
    }
  },
  commands() {
    return {
      goToNextCell(dir) {
        return goToNextCell(TABLE_DIRECTION[dir])
      },
      setCellAttr,
      mergeCells,
      splitCell,
      splitCellWithType,
      deleteCellSelection,
    }
  },
  utils({ editor }) {
    return {
      getAttrs,
      setAttrs,
      nextCell($pos, axis, dir) {
        return nextCell($pos, axis, TABLE_DIRECTION[dir])
      },
      atEndOfCell(axis, dir, view) {
        const editorView = view ?? editor.view

        if (editorView.state.selection instanceof CellSelection) {
          return this.nextCell(editorView.state.selection.$headCell, axis, dir)?.pos ?? null
        }

        if (!(editorView.state.selection instanceof TextSelection)) return null

        const { $head } = editorView.state.selection

        for (let depth = $head.depth; depth >= 0; depth--) {
          const parent = $head.node(depth)
          const index = dir === 'BEFORE' ? $head.index(depth) : $head.indexAfter(depth)

          if (dir === 'BEFORE' && index !== 0) {
            return null
          }

          if (dir === 'AFTER' && index !== parent.childCount) {
            return null
          }

          if (
            parent.type.spec.tableRole === 'cell' ||
            parent.type.spec.tableRole === 'header_cell'
          ) {
            const cellPos = $head.before(depth)

            const direction: 'up' | 'down' | 'left' | 'right' =
              axis === 'vert'
                ? dir === 'AFTER'
                  ? 'down'
                  : 'up'
                : dir === 'AFTER'
                  ? 'right'
                  : 'left'

            return editorView.endOfTextblock(direction) ? cellPos : null
          }
        }

        return null
      },
      findCellRect($pos) {
        return findCell($pos)
      },
      moveCellForward,
      pointsAtCell,
      cellNear,
      cellAround,
    }
  },
})

function getAttrs(dom: HTMLElement, cellAttributes?: Record<string, CellAttributes>): Attrs {
  if (typeof dom === 'string') return {}

  const widthAttr = dom.getAttribute('data-colwidth')
  const widths =
    widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(',').map((s) => Number(s)) : null

  const colspan = Number(dom.getAttribute('colspan')) || 1
  const rowspan = Number(dom.getAttribute('rowspan')) || 1
  const colwidth = widths && widths.length === colspan ? widths : null

  const extraAttrs: Attrs | null = cellAttributes
    ? Array.from(Object.entries(cellAttributes)).reduce((extra, [key, attr]) => {
        const getter = attr.getFromDOM
        const value = getter ? getter(dom) : null

        return {
          ...extra,
          ...(getter && { [key]: value }),
        }
      }, {} as Attrs)
    : null

  return {
    colspan,
    rowspan,
    colwidth,
    ...(extraAttrs && { ...extraAttrs }),
  }
}

function setAttrs(node: Node, cellAttributes?: Record<string, CellAttributes>): Attrs {
  const attrs: Attrs = {
    ...(node.attrs.colspan != 1 && { colspan: node.attrs.colspan }),
    ...(node.attrs.rowspan != 1 && { rowspan: node.attrs.rowspan }),
    ...(node.attrs.colwidth && { ['data-colwidth']: node.attrs.colwidth.join(',') }),
  }

  const extraAttrs: Attrs | null = cellAttributes
    ? Array.from(Object.entries(cellAttributes)).reduce((extra, [key, attr]) => {
        const setter = attr.setDOMAttr
        const value = setter ? setter(node.attrs[key], attrs) : null

        return {
          ...extra,
          ...(setter && { [key]: value }),
        }
      }, {} as Attrs)
    : null

  return {
    ...attrs,
    ...(extraAttrs && { ...extraAttrs }),
  }
}
