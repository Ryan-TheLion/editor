import { EditorState, RangeSet } from '@codemirror/state'
import { Decoration, DecorationSet, EditorView, PluginValue, ViewUpdate } from '@codemirror/view'
import { NodeSet, SyntaxNode, Tree, TreeBuffer, TreeCursor } from '@lezer/common'
import { SyntaxTreePlugin } from '../../../syntax-tree-plugin'
import { JavaScriptSyntaxNodeName } from '../../../languages'

type Tokens = SyntaxNode[]

type MatchedTokens = { node: SyntaxNode; depth: number }[]

export type BracketTokens = {
  '(': Tokens
  ')': Tokens
  '{': Tokens
  '}': Tokens
  '[': Tokens
  ']': Tokens
  '<': Tokens
  '>': Tokens
  arrow: Tokens
}

type MatchedBracketTokens = {
  '(': MatchedTokens
  ')': MatchedTokens
  '{': MatchedTokens
  '}': MatchedTokens
  '[': MatchedTokens
  ']': MatchedTokens
  '<': MatchedTokens
  '>': MatchedTokens
  arrow: MatchedTokens
}

type MatchedTypes = keyof BracketPairPluginColor

export interface Matched {
  type: MatchedTypes
  depth: number
  from: number
  to: number
}

export type IterateCase = 'enter' | 'leave'

type MatchedBracketCase = '()' | '{}' | '[]' | '<>'

type GetMatchedBracketsResult =
  | {
      matchCase: MatchedBracketCase
      has: 'both'
      open: SyntaxNode
      close: SyntaxNode
      target: SyntaxNode | null
    }
  | {
      matchCase: MatchedBracketCase
      has: 'open'
      open: SyntaxNode
      close: null
      target: SyntaxNode | null
    }
  | {
      matchCase: MatchedBracketCase
      has: 'close'
      open: null
      close: SyntaxNode
      target: SyntaxNode | null
    }
  | { matchCase: MatchedBracketCase; has: null; open: null; close: null; target: SyntaxNode | null }

interface BracketPairViewPlugin extends PluginValue {
  applyDepth: ({
    tree,
    state,
    node,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
  }) => boolean
  getBracketTokens: ({
    tree,
    state,
    node,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
  }) => BracketTokens
}

export interface BracketPairPluginConfig {
  colors: Record<'light' | 'dark', BracketPairPluginColor>
}

export interface BracketPairPluginColor {
  bracketPair: string[]
  arrow: string
}

export interface ParsedSyntaxNode {
  name: string
  text: string
  lineNumber: number
  from: number
  to: number
  node: SyntaxNode
  parent: ParsedSyntaxNode | null
}

export type BaseBracketPairViewConstructor = new (
  view: EditorView,
  config: BracketPairPluginConfig,
) => SyntaxTreePlugin

export const bracketPairDefaultConfig: BracketPairPluginConfig = {
  colors: {
    light: {
      bracketPair: ['#ff9000', '#b835f5', '#1157fb'],
      arrow: '#4682B4',
    },
    dark: {
      bracketPair: ['#ffcd15', '#dc72fc', '#23a6fc'],
      arrow: '#c792ea',
    },
  },
}

const initialMatchedBracketTokens: MatchedBracketTokens = {
  '(': [],
  ')': [],
  '{': [],
  '}': [],
  '[': [],
  ']': [],
  '<': [],
  '>': [],
  arrow: [],
}

export abstract class BaseBracketPairView
  extends SyntaxTreePlugin
  implements BracketPairViewPlugin
{
  #depth: number = 0
  #matchedBracketTokens: MatchedBracketTokens = initialMatchedBracketTokens

  #config: BracketPairPluginConfig

  static initialBracketTokens: () => BracketTokens = () => ({
    '(': [],
    ')': [],
    '{': [],
    '}': [],
    '[': [],
    ']': [],
    '<': [],
    '>': [],
    arrow: [],
  })

  constructor(view: EditorView, config: BracketPairPluginConfig) {
    super(view)

    this.#config = config
  }

  canUpdate({
    updatedTree,
  }: {
    tree: Tree
    viewUpdate: ViewUpdate
    updatedTree: boolean
  }): boolean {
    return updatedTree
  }

  getDecorations = ({ tree }: { tree: Tree; currentDecorations: DecorationSet }) => {
    const state = this.view.state

    this.#depth = 0
    this.#matchedBracketTokens = initialMatchedBracketTokens

    const { getBracketTokens, utils } = this

    const mergeTokens = this.#mergeTokens

    const setDepth = (depth: number) => {
      this.#depth = depth
    }

    const setMatchedBracketTokens = (tokens: MatchedBracketTokens) => {
      this.#matchedBracketTokens = tokens
    }

    tree.iterate({
      enter({ node }) {
        setDepth(utils.getDepth({ tree, node, state, iterateCase: 'enter' }))

        const tokens = mergeTokens(getBracketTokens({ tree, state, node }))

        setMatchedBracketTokens(tokens)
      },
      leave({ node }) {
        setDepth(utils.getDepth({ tree, node, state, iterateCase: 'leave' }))
      },
    })

    const matched: Matched[] = []

    Array.from(Object.entries(this.#matchedBracketTokens))
      .filter(([, value]) => !!value)
      .forEach(([key, tokens]) => {
        for (const token of tokens!) {
          const tokenType = key as keyof BracketTokens

          matched.push({
            type: tokenType === 'arrow' ? 'arrow' : 'bracketPair',
            depth: token.depth,
            from: token.node.from,
            to: token.node.to,
          })
        }
      })

    if (!matched.length) return RangeSet.empty

    const ranges = matched
      .sort((a, b) => a.from - b.from)
      .map(({ type, depth, from, to }) => {
        const color = this.#getColor({ type, depth })

        if (type === 'arrow') {
          return arrowMark(color).range(from, to)
        }

        return bracketPairMark(color).range(from, to)
      })

    return Decoration.set(ranges)
  }

  get utils() {
    return {
      parseNode: this.#parseNode,
      debugConsole: this.#debugConsole,
      traverseNode: this.#traverseNode,
      getDepth: this.#getDepth,
      calcDepth: this.#calcDepth,
      getMatchedBrackets: this.#getMatchedBrackets,
      getType: this.#getType,
    }
  }

  get config() {
    return this.#config
  }

  get depth() {
    return this.#depth
  }

  get themeMode() {
    return this.view.state.facet(EditorView.darkTheme.reader) ? 'dark' : 'light'
  }

  /**
   * - depth를 증가(enter) / 감소(leave) 해도 되는지 유무를 반환
   * - `false`인 경우 현재 depth를 유지
   */
  abstract applyDepth: ({
    tree,
    state,
    node,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
  }) => boolean

  /**
   * 브라켓 페어를 적용할 노드를 반환
   * ( `(`, `)`, `{`, `}`, `[`, `]`, `<`, `>` , `arrow('=>')` )
   */
  abstract getBracketTokens: ({
    tree,
    state,
    node,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
  }) => BracketTokens

  #getMatchedBrackets = ({
    node,
    childContext,
    matchCase,
  }: {
    node?: SyntaxNode | null
    childContext?: string[]
    matchCase: MatchedBracketCase
  }): {
    result: GetMatchedBracketsResult
    applyToBracketTokens: (bracketTokens: BracketTokens) => BracketTokens
  } => {
    const applyToBracketTokens =
      (result: GetMatchedBracketsResult) => (bracketTokens: BracketTokens) => {
        const bracketNodeName = targetBracketNodeName(matchCase)

        result.open && bracketTokens[bracketNodeName.open].push(result.open)
        result.close && bracketTokens[bracketNodeName.close].push(result.close)

        return bracketTokens
      }

    if (!node) {
      const result = {
        matchCase,
        open: null,
        close: null,
        has: null,
        target: null,
      } as GetMatchedBracketsResult

      return {
        result,
        applyToBracketTokens: applyToBracketTokens(result),
      }
    }

    const hasNode = ({
      open,
      close,
    }: {
      open: SyntaxNode | null
      close: SyntaxNode | null
    }): 'both' | 'open' | 'close' | null => {
      const hasOpen = !!open
      const hasClose = !!close

      if (hasOpen && hasClose) return 'both'
      if (hasOpen || hasClose) {
        return hasOpen ? 'open' : 'close'
      }

      return null
    }

    let target: SyntaxNode | null = node

    if (childContext?.length) {
      for (const childNodeName of childContext) {
        if (!target) break

        target = target?.getChild(childNodeName) ?? null
      }
    }

    const targetBracketNodeName: (matchCase: MatchedBracketCase) => {
      open: '(' | '{' | '[' | '<'
      close: ')' | '}' | ']' | '>'
    } = (matchCase) => {
      if (matchCase === '()') {
        return {
          open: '(',
          close: ')',
        }
      }

      if (matchCase === '{}') {
        return {
          open: '{',
          close: '}',
        }
      }

      if (matchCase === '[]') {
        return {
          open: '[',
          close: ']',
        }
      }

      return {
        open: '<',
        close: '>',
      }
    }

    const bracketNodeName = targetBracketNodeName(matchCase)

    const open = target?.getChild(bracketNodeName.open) ?? null
    const close = target?.getChild(bracketNodeName.close) ?? null

    const result = {
      matchCase,
      open,
      close,
      has: hasNode({ open, close }),
      target,
    } as GetMatchedBracketsResult

    return {
      result,
      applyToBracketTokens: applyToBracketTokens(result),
    }
  }

  #getColor = ({ type, depth }: { type: MatchedTypes; depth: number }) => {
    const colors = this.#config.colors[this.themeMode][type]

    if (Array.isArray(colors)) {
      return colors[(depth - 1) % colors.length]!
    }

    return colors
  }

  #getDepth: ({
    tree,
    node,
    state,
    iterateCase,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
    iterateCase: 'enter' | 'leave'
  }) => number = ({ tree, node, state, iterateCase }) => {
    if (this.applyDepth({ tree, node, state })) return this.#calcDepth(iterateCase)

    return this.depth
  }

  #calcDepth = (iterateCase: IterateCase) => {
    const currentDepth = this.#depth

    if (iterateCase === 'enter') return currentDepth + 1

    return currentDepth - 1
  }

  #parseNode = (node?: SyntaxNode | null): ParsedSyntaxNode | null => {
    if (!node) return null

    return {
      name: node.name,
      text: this.view.state.doc.sliceString(node.from, node.to),
      lineNumber: this.view.state.doc.lineAt(node.from).number,
      from: node.from,
      to: node.to,
      node,
      parent: this.#parseNode(node.parent),
    }
  }

  #debugConsole = (node?: SyntaxNode | null) => {
    if (!node) {
      console.log(null)

      return
    }

    console.log(this.#parseNode(node))
  }

  #mergeTokens = (tokens: BracketTokens): MatchedBracketTokens => {
    const depth = this.#depth

    const merge = (nodes: Tokens): MatchedTokens => {
      return nodes.map((node) => ({
        node,
        depth,
      }))
    }

    return {
      '(': [...this.#matchedBracketTokens['('], ...merge(tokens['('])],
      ')': [...this.#matchedBracketTokens[')'], ...merge(tokens[')'])],
      '{': [...this.#matchedBracketTokens['{'], ...merge(tokens['{'])],
      '}': [...this.#matchedBracketTokens['}'], ...merge(tokens['}'])],
      '[': [...this.#matchedBracketTokens['['], ...merge(tokens['['])],
      ']': [...this.#matchedBracketTokens[']'], ...merge(tokens[']'])],
      '<': [...this.#matchedBracketTokens['<'], ...merge(tokens['<'])],
      '>': [...this.#matchedBracketTokens['>'], ...merge(tokens['>'])],
      arrow: [...this.#matchedBracketTokens['arrow'], ...merge(tokens['arrow'])],
    }
  }

  #traverseNode = (node: SyntaxNode, callback?: (currentNode: SyntaxNode) => void) => {
    const cursor = node.cursor()

    while (cursor.next() && cursor.from < node.to) {
      if (callback) {
        callback(cursor.node)
        continue
      }

      this.#debugConsole(cursor.node)
    }
  }

  #getTreeNodeSet = (tree: Tree): NodeSet | null => {
    const cursor = tree.cursor()

    while (cursor.next() && cursor.from < tree.topNode.to) {
      const treeCursor = cursor as TreeCursor & { buffer?: { buffer?: TreeBuffer } }

      if (treeCursor?.buffer?.buffer && treeCursor.buffer.buffer instanceof TreeBuffer) {
        return treeCursor.buffer.buffer.set
      }
    }

    return null
  }

  #getType = (tree: Tree, typeName: JavaScriptSyntaxNodeName) => {
    const nodeSet = this.#getTreeNodeSet(tree)

    return nodeSet?.types.find((type) => type.name === typeName) ?? null
  }
}

export const bracketPairMark = (color: string) =>
  Decoration.mark({
    class: 'bracket-pair',
    attributes: {
      style: `--bracket-color: ${color};`,
    },
    /*
      <T extends Record<any,any>> 와 같은 상황에서 >> 렌더링 이슈를 해결하기 위함
      - div로 설정하지 않을 경우(span 으로 적용될 경우), >> 에서
        첫번째 브라켓 컬러가 css로 적용된 색상이 아닌
        두번째 브라켓 컬러로 렌더링 되어 정상적으로 브라켓 색상 반영이 되지 않음
    */
    tagName: 'div',
  })

export const arrowMark = (color: string) =>
  Decoration.mark({
    class: 'bracket-pair--arrow-token',
    attributes: {
      style: `--arrow-color: ${color}`,
    },
  })

export const bracketTheme = EditorView.baseTheme({
  '&.cm-editor .bracket-pair': {
    display: 'inline',
    color: 'var(--bracket-color)',
  },
  '&.cm-editor .bracket-pair > *': {
    display: 'inline',
    color: 'var(--bracket-color)',
  },
  '&.cm-editor .bracket-pair--arrow-token': {
    color: 'var(--arrow-color)',
  },
  '&.cm-editor .bracket-pair--arrow-token > *': {
    color: 'var(--arrow-color)',
  },
})
