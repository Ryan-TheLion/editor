import { chainCommands } from 'prosemirror-commands'
import { keydownHandler } from 'prosemirror-keymap'
import { Fragment, Node, Schema } from 'prosemirror-model'
import { Command, EditorState, Plugin, Selection, TextSelection } from 'prosemirror-state'
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  columnResizing,
  ColumnResizingOptions,
  deleteCellSelection,
  deleteColumn,
  deleteRow,
  deleteTable,
  isInTable,
  selectionCell,
  tableEditing,
  TableEditingOptions,
  TableMap,
  TableRole,
} from 'prosemirror-tables'

import { Dispatch, MergeConfigMap } from '../../../typing'
import {
  combineProsemirrorKeys,
  ContentChildList,
  fragmentChildren,
  getNodePos,
  insertNewLineAtNextBlock,
  insertNewLineAtPrevBlock,
  nextLineNode,
  prevLineNode,
  PROSEMIRROR_KEYBOARD,
} from '../../utils'
import { BlockAlign } from '../block-align'
import { NodeExtension } from '../core'
import { Figure } from '../figure'
import { Paragraph, PARAGRAPH_NAME } from '../paragraph'
import {
  Axis,
  TABLE_DIRECTION,
  TABLE_ROW_NAME,
  TableCell,
  TableDirectionKey,
  TableHeader,
  TableRow,
} from '.'

export interface TableCommands {
  /**
   * - `prosemirror-tables` 메소드
   * - Command to add a column after the column with the selection.
   */
  addColumnAfter: typeof addColumnAfter
  /**
   * - `prosemirror-tables` 메소드
   * - Command to add a column before the column with the selection.
   */
  addColumnBefore: typeof addColumnBefore
  /**
   * - `prosemirror-tables` 메소드
   * - Add a table row after the selection.
   */
  addRowAfter: typeof addRowAfter
  /**
   * - `prosemirror-tables` 메소드
   * - Add a table row before the selection.
   */
  addRowBefore: typeof addRowBefore
  /**
   * @internal
   */
  maybeSetSelection: (selection: Selection, state?: EditorState, dispatch?: Dispatch) => boolean
  /**
   * table에 cation 을 적용
   * - `<table>...</table>` 과 같은 구조
   *  => `<figure><table>...</table><figcaption>caption</figcaption></figure>` 과 같은 구조로 변환
   */
  setCaption: (caption?: string) => Command
  /**
   * table에 적용된 caption 구조를 해제
   * - `<figure><table>...</table><figcaption>caption</figcaption></figure>` 과 같은 구조
   *  => `<table>...</table>` 과 같은 구조로 변환
   */
  unsetCaption: Command
  /**
   * - `prosemirror-tables` 메소드
   * - Deletes the table around the selection, if any.
   */
  deleteTable: typeof deleteTable
  /**
   * table의 모든 cell 이 선택된 상태일 경우 table 삭제
   */
  deleteTableWhenAllSelected: Command
  /**
   * - `prosemirror-tables` 메소드
   * - Deletes the content of the selected cells, if they are not empty.
   */
  deleteCellSelection: typeof deleteCellSelection
  /** @internal */
  tableArrowKey: (axis: Axis, dir: TableDirectionKey) => Command
  /** @internal */
  tableShiftArrowKey: (axis: Axis, dir: TableDirectionKey) => Command
  /**
   * `row` 개의 행과 `col` 개의 열을 가지는 table 을 삽입
   * - 기본 값 `{ row = 2, col = 2 }`
   */
  insertTable: (props?: { row?: number; col?: number }) => Command
  /** table 내부에서 외부로 escape(탈출) 할 수 있도록 해주는 command*/
  exitTable: Command
  /**
   * - `delimiter`
   *   - 기본값 `␣␣␣␣` (공백 4개)
   *   - 셀 구분 문자 (row 마지막 셀에는 추가되지 않음)
   *   - `renderEachCellPerLine: true` 일 경우 셀 구분 문자는 추가 되지 않음
   * - `renderEachCellPerLine`
   *   - 각 셀을 블럭 단위로 렌더링 할 것인지 유무
   *   - 기본값 `false`
   *   - `true`
   *     - 각 셀을 블록 단위로 렌더링
   *     ```jsx
   *     |cell1|cell2|
   *     |-----|-----|
   *     |cell3|cell4|
   *           ▼
   *     <p>cell1</p>
   *     <p>cell2</p>
   *     <p>cell3</p>
   *     <p>cell4</p>
   *     ```
   *   - `false`
   *     - 최대한 row의 인라인 cell 노드를 유지하고, 블럭 요소는 분리해서 렌더링
   *     ```jsx
   *     |cell1|cell2<block>|
   *     |-----|------------|
   *     |cell3|cell4       |
   *               ▼
   *     <p>cell1{delimiter}cell2</p>
   *     <block>
   *     <p>cell3{delimiter}cell4</p>
   *     ```
   * - 중첩된 테이블은 lift 이후 유지
   *   - `renderEachCellPerLine: true`
   *   ```jsx
   *   |cell1      |cell2|
   *   ||sub1|sub2||     |
   *   ||----|----||     |
   *   ||sub3|sub4||     |
   *   |-----------|-----|
   *   |cell3      |cell4|
   *            ▼
   *   <p>cell1</p>
   *   <p>cell2</p>
   *   <sub-table>
   *   <p>cell3</p>
   *   <p>cell4</p>
   *   ```
   *   - `renderEachCellPerLine: false`
   *   ```jsx
   *   |cell1      |cell2|
   *   ||sub1|sub2||     |
   *   ||----|----||     |
   *   ||sub3|sub4||     |
   *   |-----------|-----|
   *   |cell3      |cell4|
   *            ▼
   *   <p>cell1</p>
   *   <p>{delimiter}cell2</p>
   *   <sub-table>
   *   <p>cell3{delimiter}cell4</p>
   *   ```
   */
  liftTable: (opt?: { renderEachCellPerLine?: boolean; delimiter?: string }) => Command
  /**
   * - `prosemirror-tables` 메소드
   * - Remove the selected rows from a table.
   */
  deleteRow: typeof deleteRow
  /**
   * - `prosemirror-tables` 메소드
   * - Command function that removes the selected columns from a table.
   */
  deleteColumn: typeof deleteColumn
}

export interface TableUtils {
  /** table 내에 있는지 유무 */
  isAcitve: () => boolean
  /** state(없을 경우 editor의 state)에서 table 내에 있는지 유무 */
  isInTable: (state?: EditorState) => boolean
  /** state(없을 경우 editor의 state)에서 table 내에 있을 경우 해당 table 노드 반환 */
  findTableInSelection: (state?: EditorState) => { node: Node; pos: number } | null
  /** node가 table node 인지 유무 */
  isTableNode: (node: Node) => boolean
  /** node 가 table node일 경우 table node의 coords 반환 */
  getTableCoords: (node: Node) => {
    left: number
    right: number
    top: number
    bottom: number
  } | null
  /**
   * tableMap에서 row, col 에 해당하는 cell의 index를 반환
   * - row, col은 zero-based index(0부터 시작)
   */
  getTableMapIndex: ({ row, col }: { row: number; col: number; tableMap: TableMap }) => number
  /**
   * startCell row, col 위치의 cell 로 부터 offset 만큼 row 방향으로 선택된 CellSelection 반환
   * - row, col은 zero-based index(0부터 시작)
   * - offset을 end로 설정할 경우 start cell부터 row 방향 마지막 cell까지 선택
   */
  getRowSelection: ({
    tableNode,
    doc,
    startCell,
    offset,
  }: {
    tableNode: Node
    doc: Node
    startCell: { row: number; col: number }
    offset: number | 'end'
  }) => CellSelection | null
  /**
   * startCell row, col 위치의 cell 로 부터 offset 만큼 column 방향으로 선택된 CellSelection 반환
   * - row, col은 zero-based index(0부터 시작)
   * - offset을 end로 설정할 경우 start cell부터 column 방향 마지막 cell까지 선택
   */
  getColSelection: ({
    tableNode,
    doc,
    startCell,
    offset,
  }: {
    tableNode: Node
    doc: Node
    startCell: {
      row: number
      col: number
    }
    offset: number | 'end'
  }) => CellSelection | null
  /**
   * table node의 모든 셀을 선택한 CellSelection 반환
   */
  getSelectedAllCellsSelection: ({
    tableNode,
    doc,
  }: {
    tableNode: Node
    doc: Node
  }) => CellSelection | null
}

export interface TableOptions {
  /**
   * (node spec) groups
   * - ex. `block` , `inline`
   * - 기본값 `block`
   */
  tableGroup?: string
  /**
   * `prosemirror-tables` 의 `tableEditing` 플러그인
   *
   * - `active`
   *   - 플러그인을 적용할지 유무
   *   - 기본 값 `true`
   * - `options`
   *   - `allowTableNodeSelection` \
   *   테이블 노드로 NodeSelection을 적용할 경우 동작을 선택
   *     - `true`: table 노드에 selection 이 적용됨
   *     - `false`: table 셀 전체가 선택 됨
   *     - 기본 값 `false`
   */
  editing?: {
    active: boolean
    options?: TableEditingOptions
  }
  /**
   * `prosemirror-tables` 의 `columnResizing` 플러그인
   *
   * - `active`
   *   - 플러그인을 적용할지 유무
   *   - 기본 값 `true`
   * - `options`
   *   - `handleWidth`
   *     - 열 크기 조절 핸들의 너비 (픽셀 단위)
   *     - 기본 값 `4`
   *   - `cellMinWidth`
   *     - 셀의 최소 너비 (픽셀 단위)
   *     - 기본 값 `50`
   *   - `lastColumnResizable`
   *   마지막 열도 크기 조절이 가능하도록 허용할지 여부
   *   - `View`
   *   커스텀 리사이징 뷰를 지정할 수 있는 옵션
   */
  resizing?: {
    active: boolean
    options?: ColumnResizingOptions
  }
}

export const TABLE_NAME = 'table' as const

/** `Table` 노드의 `tableRole` 속성 값 */
export const TABLE_TABLE_ROLE: TableRole = 'table' as const

/**
 * table (<table>) node extension
 *
 * **shortcut**
 * - `Shift-Enter`
 *   - exitTable
 */
export const Table = NodeExtension.create<
  MergeConfigMap<{
    name: typeof TABLE_NAME
    commands: TableCommands
    utils: TableUtils
  }>,
  TableOptions
>({
  name: TABLE_NAME,
  options: {
    tableGroup: 'block',
    editing: {
      active: true,
      options: {
        allowTableNodeSelection: false,
      },
    },
    resizing: {
      active: true,
      options: {
        handleWidth: 4,
        cellMinWidth: 50,
      },
    },
  },
  nodeSpec({ options }) {
    return {
      content: `${TABLE_ROW_NAME}+`,
      tableRole: TABLE_TABLE_ROLE,
      isolating: true,
      group: options.tableGroup,
      parseDOM: [{ tag: 'table' }],
      toDOM() {
        return ['table', ['tbody', 0]]
      },
    }
  },
  commands({ editor, nodeType, utils }) {
    return {
      addColumnAfter,
      addColumnBefore,
      addRowAfter,
      addRowBefore,
      insertTable({ row = 2, col = 2 } = {}) {
        return (state, dispatch, view) => {
          if (view && !view.editable) return false

          const rowHeaderCells = Array.from({ length: col }).map(
            () => TableHeader.nodeType.createAndFill()!,
          )

          const cells = Array.from({ length: col }).map(() => TableCell.nodeType.createAndFill()!)
          const rows = Array.from({ length: row }).map((_, index) =>
            index === 0
              ? TableRow.nodeType.create(null, rowHeaderCells)
              : TableRow.nodeType.create(null, cells),
          )

          const table = nodeType.create(null, rows)

          const { $from, $to } = state.selection

          const marks = [...$from.marks(), ...$to.marks()]
          const canInsertTable = state.doc.canReplaceWith(
            $from.index($from.depth),
            $to.index($to.depth),
            nodeType,
            marks.length ? marks : undefined,
          )

          if (!canInsertTable) return false

          const tr = state.tr.replaceSelectionWith(table).scrollIntoView()
          const resolvedPos = tr.doc.resolve(state.tr.selection.anchor + 1)

          tr.setSelection(TextSelection.near(resolvedPos))

          if (dispatch) {
            dispatch(tr)
            view?.focus()
          }

          return true
        }
      },
      liftTable({ renderEachCellPerLine = false, delimiter = '    ' } = {}) {
        return (state, dispatch, view) => {
          const table = utils.findTableInSelection(state)

          if (!table) return false

          const isBlockAlignTable = BlockAlign.utils.isBlockAlignChlid({
            node: table.node,
            selection: state.selection,
          })

          if (isBlockAlignTable) return false

          const tr = state.tr

          const prevLine = prevLineNode({ state })
          const nextLine = nextLineNode({ state })

          if (prevLine && utils.isTableNode(prevLine)) {
            insertNewLineAtPrevBlock({ state, tr })
          }

          if (nextLine && utils.isTableNode(nextLine)) {
            insertNewLineAtNextBlock({ state, tr })
          }

          const rows = ContentChildList.from(table.node).map((row) => {
            const cell = ContentChildList.from(row)

            const content = cell.map((cell) => {
              const flatten = ContentChildList.from(cell)

              return flatten
            })

            return content
          })

          const convertedNodes: Node[] = []

          if (renderEachCellPerLine) {
            rows.forEach((rowCells) => {
              convertedNodes.push(...rowCells.flat())
            })
          } else {
            rows.forEach((rowCells, rowIndex) => {
              const nodes = mergeRow({ rowCells, schema: state.schema, delimiter })

              convertedNodes.push(...nodes)
            })
          }

          tr.delete(table.pos, table.pos + table.node.nodeSize)

          const insertPos = tr.selection.$from.pos
          const beforeContentSize = tr.doc.content.size

          tr.insert(insertPos, convertedNodes)

          const afterContentSize = tr.doc.content.size

          const offset = afterContentSize - beforeContentSize

          const $near = tr.doc.resolve(insertPos + offset)

          tr.setSelection(TextSelection.near($near))

          dispatch?.(tr)

          return true
        }
      },
      deleteRow,
      deleteColumn,
      setCaption(caption) {
        return (state, dispatch, view) => {
          const table = utils.findTableInSelection(state)

          if (!table) return false

          if (dispatch) {
            deleteTable(state, dispatch)
          }

          return Figure.commands.insertFigure({
            childNode: table.node,
            align: 'full',
            caption,
            marks: table.node.marks,
          })(editor.state, editor.view.dispatch, editor.view)
        }
      },
      unsetCaption(state, dispatch, view) {
        const table = utils.findTableInSelection(state)

        if (!table) return false

        const tableDOM = (view ?? editor.view).nodeDOM(table.pos)
        const parent = tableDOM?.parentElement

        const isBlockAlignContainer = parent?.classList.contains('block-align-container')

        if (!isBlockAlignContainer) return false

        if (dispatch) {
          const tr = state.tr

          const $container = state.doc.resolve(table.pos)
          const from = $container.before()
          const to = $container.after()

          tr.replace(from, to, table.node.slice(0))

          dispatch(tr)
        }

        return true
      },
      deleteTable,
      exitTable(state, dispatch, view) {
        if (view && !view.editable) return false

        if (!utils.isInTable(state)) {
          return false
        }

        const tableNode = utils.findTableInSelection(state)

        if (!tableNode) return false

        if (dispatch) {
          const paragraph = Paragraph.nodeType.create()
          const resolvedPos = state.doc.resolve(tableNode.pos + tableNode.node.nodeSize)

          const tr = state.tr.insert(resolvedPos.pos, paragraph)

          const focusPos = tr.doc.resolve(resolvedPos.pos + paragraph.nodeSize - 1)

          dispatch(tr.setSelection(TextSelection.near(focusPos)).scrollIntoView())
        }

        return true
      },
      tableArrowKey(axis, dir) {
        return (state, dispatch, view) => {
          if (view && !view.editable) return false

          const selection = state.selection

          if (selection instanceof CellSelection) {
            return this.maybeSetSelection(
              Selection.near(selection.$headCell, TABLE_DIRECTION[dir]),
              state,
              dispatch,
            )
          }

          if (axis !== 'horiz' && !selection.empty) return false

          const end = TableCell.utils.atEndOfCell(axis, dir)

          if (end === null) return false

          if (axis === 'horiz') {
            return this.maybeSetSelection(
              Selection.near(
                state.doc.resolve(selection.head + TABLE_DIRECTION[dir]),
                TABLE_DIRECTION[dir],
              ),
              state,
              dispatch,
            )
          }

          const $cell = state.doc.resolve(end)
          const $next = TableCell.utils.nextCell($cell, axis, dir)

          let newSelection: Selection

          if ($next) {
            newSelection = Selection.near($next, 1)
          } else if (dir === 'BEFORE') {
            newSelection = Selection.near(state.doc.resolve($cell.before(-1)), -1)
          } else {
            newSelection = Selection.near(state.doc.resolve($cell.after(-1)), 1)
          }

          return this.maybeSetSelection(newSelection, state, dispatch)
        }
      },
      tableShiftArrowKey(axis, dir) {
        return (state, dispatch, view) => {
          if (view && !view.editable) return false

          const selection = state.selection

          const end = TableCell.utils.atEndOfCell(axis, dir, view)

          if (end === null) return false

          const cellSelection: CellSelection =
            selection instanceof CellSelection
              ? selection
              : new CellSelection(state.doc.resolve(end))

          const $head = TableCell.utils.nextCell(cellSelection.$headCell, axis, dir)

          if (!$head) return false

          return this.maybeSetSelection(
            new CellSelection(cellSelection.$anchorCell, $head),
            state,
            dispatch,
          )
        }
      },
      deleteTableWhenAllSelected(state, dispatch, view) {
        const selection = state.selection

        if (!(selection instanceof CellSelection)) return false

        const tableNode = utils.findTableInSelection(state)

        if (!tableNode) return false

        const tableMap = TableMap.get(tableNode.node)

        if (tableMap.width * tableMap.height === selection.ranges.length) {
          const tableDOM = (view ?? editor.view).nodeDOM(tableNode.pos)
          const parent = tableDOM?.parentElement

          const isBlockAlignContainer = parent?.classList.contains('block-align-container')

          if (isBlockAlignContainer) {
            if (dispatch) {
              const $container = state.doc.resolve(tableNode.pos)

              const tr = state.tr

              tr.delete($container.before(), $container.after())

              dispatch(tr)
            }

            return true
          }

          return this.deleteTable(state, dispatch)
        }

        return false
      },
      deleteCellSelection,
      maybeSetSelection(selection, state, dispatch) {
        const editorState = state ?? editor.state

        if (selection.eq(editorState.selection)) return false

        if (dispatch) {
          dispatch(editorState.tr.setSelection(selection).scrollIntoView())
        }

        return true
      },
    }
  },
  utils({ editor, nodeType }) {
    return {
      getTableCoords(node) {
        if (!this.isTableNode(node)) return null

        const pos = getNodePos({ node, doc: editor.state.doc })!

        if (typeof pos !== 'number') return null

        const coords = editor.view.coordsAtPos(pos)

        return {
          ...coords,
        }
      },
      getTableMapIndex({ row, col, tableMap }) {
        return row * tableMap.width + col
      },
      isInTable(state) {
        return isInTable(state ?? editor.state)
      },
      isAcitve() {
        return this.isInTable()
      },
      isTableNode(node) {
        return node.type.name === nodeType.name
      },
      findTableInSelection(state) {
        const editorState = state ?? editor.state

        if (!this.isInTable(editorState)) return null

        const cell = selectionCell(editorState)

        for (let depth = cell.depth; depth > 0; depth--) {
          const node = cell.node(depth)

          if (node.type === nodeType) {
            return { node, pos: cell.before(depth) }
          }
        }

        return null
      },
      getRowSelection({ tableNode, doc, startCell: { row, col }, offset }) {
        if (!Table.utils.isTableNode(tableNode)) return null

        const tableMap = TableMap.get(tableNode)

        const rows = tableMap.height
        if (row < 0 || row > rows - 1) return null

        const columns = tableMap.width
        if (col < 0 || col > columns - 1) return null

        const targetOffset = offset === 'end' ? columns - (col + 1) : offset

        if (targetOffset <= 0 || targetOffset > columns - 1) return null

        const start: number = tableMap.map[Table.utils.getTableMapIndex({ row, col, tableMap })]!
        const last: number =
          tableMap.map[Table.utils.getTableMapIndex({ row, col: col + targetOffset, tableMap })]!

        return CellSelection.create(doc, start + 1, last + 1)
      },
      getColSelection({ tableNode, doc, startCell: { row, col }, offset }) {
        if (!Table.utils.isTableNode(tableNode)) return null

        const tableMap = TableMap.get(tableNode)

        const rows = tableMap.height
        if (row < 0 || row > rows - 1) return null

        const columns = tableMap.width
        if (col < 0 || col > columns - 1) return null

        const targetOffset = offset === 'end' ? rows - (row + 1) : offset

        if (targetOffset <= 0 || targetOffset > rows - 1) return null

        const start: number = tableMap.map[Table.utils.getTableMapIndex({ row, col, tableMap })]!
        const last: number =
          tableMap.map[Table.utils.getTableMapIndex({ row: row + targetOffset, col, tableMap })]!

        return CellSelection.create(doc, start + 1, last + 1)
      },
      getSelectedAllCellsSelection({ tableNode, doc }) {
        if (!this.isTableNode(tableNode)) return null

        const tableMap = TableMap.get(tableNode)

        const start = tableMap.map[this.getTableMapIndex({ row: 0, col: 0, tableMap })]!
        const last =
          tableMap.map[
            this.getTableMapIndex({ row: tableMap.height - 1, col: tableMap.width - 1, tableMap })
          ]!

        return CellSelection.create(doc, start + 1, last + 1)
      },
    }
  },
  plugins({ commands, options: { editing, resizing } }) {
    const plugins: Plugin[] = []

    const tableEditingBasePlugin = tableEditing(editing?.options)

    const deleteKeyCommand = chainCommands(
      commands.deleteTableWhenAllSelected,
      commands.deleteCellSelection,
    )

    const tableEditingPlugin = new Plugin({
      ...tableEditingBasePlugin.spec,
      props: {
        ...tableEditingBasePlugin.spec.props,
        handleTripleClickOn(view) {
          return !view.editable
        },
        handleKeyDown: keydownHandler({
          [PROSEMIRROR_KEYBOARD.ArrowLeft]: commands.tableArrowKey('horiz', 'BEFORE'),
          [PROSEMIRROR_KEYBOARD.ArrowRight]: commands.tableArrowKey('horiz', 'AFTER'),
          [PROSEMIRROR_KEYBOARD.ArrowUp]: commands.tableArrowKey('vert', 'BEFORE'),
          [PROSEMIRROR_KEYBOARD.ArrowDown]: commands.tableArrowKey('vert', 'AFTER'),
          [combineProsemirrorKeys('Shift', 'ArrowLeft')]: commands.tableShiftArrowKey(
            'horiz',
            'BEFORE',
          ),
          [combineProsemirrorKeys('Shift', 'ArrowRight')]: commands.tableShiftArrowKey(
            'horiz',
            'AFTER',
          ),
          [combineProsemirrorKeys('Shift', 'ArrowUp')]: commands.tableShiftArrowKey(
            'vert',
            'BEFORE',
          ),
          [combineProsemirrorKeys('Shift', 'ArrowDown')]: commands.tableShiftArrowKey(
            'vert',
            'AFTER',
          ),
          Tab: TableCell.commands.goToNextCell('AFTER'),
          'Shift-Tab': TableCell.commands.goToNextCell('BEFORE'),
          Backspace: deleteKeyCommand,
          'Mod-Backspace': deleteKeyCommand,
          Delete: deleteKeyCommand,
          'Mod-Delete': deleteKeyCommand,
          'Shift-Enter': commands.exitTable,
        }),
      },
    })

    if (editing?.active ?? true) plugins.push(tableEditingPlugin)
    if (resizing?.active ?? true) plugins.push(columnResizing(resizing?.options))

    return plugins
  },
})

const mergeRow = ({
  rowCells,
  schema,
  delimiter = '    ',
}: {
  rowCells: Node[][]
  schema: Schema
  delimiter?: string
}) => {
  let mergedFragment = Fragment.empty

  rowCells.forEach((cell, cellIndex) => {
    const fragment = normalizeCellContent({
      nodes: cell,
      schema,
      // row의 마지막 셀 노드에는 delimiter를 추가하지 않음
      delimiter: cellIndex < rowCells.length - 1 ? delimiter : undefined,
    })

    mergedFragment = mergedFragment.append(fragment)
  })

  // 최종 normalize (delimiter 텍스트 노드도 포함해서)
  return fragmentChildren(normalizeCellContent({ nodes: fragmentChildren(mergedFragment), schema }))
}

const normalizeCellContent = ({
  nodes,
  schema,
  delimiter,
}: {
  nodes: Node[]
  schema: Schema
  delimiter?: string
}) => {
  let fragment = Fragment.empty

  let contentBuffer: Node[] = []

  const paragraphNodeType = schema.nodes[PARAGRAPH_NAME]!

  nodes.forEach((child) => {
    if (child.isTextblock || child.isText) {
      if (!child.isText && child.content.size) {
        contentBuffer.push(...ContentChildList.from(child))

        return
      }

      child.isText ? contentBuffer.push(child) : contentBuffer.push(schema.text(' '))

      return
    }

    if (contentBuffer.length) {
      fragment = fragment.addToEnd(paragraphNodeType.create(null, contentBuffer))

      contentBuffer = []
    }

    fragment = fragment.addToEnd(child)
  })

  if (contentBuffer.length) {
    fragment = fragment.addToEnd(paragraphNodeType.create(null, contentBuffer))

    contentBuffer = []
  }

  if (delimiter) {
    fragment = fragment.append(Fragment.from(schema.text(delimiter)))
  }

  return fragment
}
