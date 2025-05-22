import { EditorState } from '@codemirror/state'
import { SyntaxNode, Tree } from '@lezer/common'
import { bracketPair } from '../bracket-pair'
import { BaseBracketPairView, BracketPairPluginConfig, BracketTokens } from './core'
import {
  JAVA_SCRIPT_SYNTAXNODE_NAME,
  JavaScriptSyntaxNodeName,
  javascriptSyntaxNodeNames,
} from '../../../languages/js'

export class JsBracketPairView extends BaseBracketPairView {
  applyDepthImmediatelyNodes = new Set<JavaScriptSyntaxNodeName>([
    'ImportGroup',
    'ExportGroup',
    'EnumDeclaration',
    'ForStatement',
    'WhileStatement',
    'DoStatement',
    'WithStatement',
    'SwitchStatement',
    'IfStatement',
    'TryStatement',
    'FunctionDeclaration',
    'FunctionExpression',
    'FunctionSignature',
    'ParenthesizedType',
    'ObjectType',
    'ObjectPattern',
    'IndexedType',
    'IndexSignature',
    'ArrayPattern',
    'ClassExpression',
    'ClassDeclaration',
    'MethodDeclaration',
    'JSXEscape',
  ])

  applyDepth: ({
    tree,
    state,
    node,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
  }) => boolean = ({ node }) => {
    if (this.applyDepthImmediatelyNodes.has(node.name as JavaScriptSyntaxNodeName)) return true
    if (nodeIsIIFE(node)) return true

    const parentNodeName: JavaScriptSyntaxNodeName | undefined = node.parent?.name as
      | JavaScriptSyntaxNodeName
      | undefined

    switch (node.name as JavaScriptSyntaxNodeName) {
      case 'Block': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.SwitchBody) return true

        return false
      }
      case 'TypeParamList': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.ArrowFunction) return false
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.FunctionSignature) return false

        if (node.prevSibling?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.VariableDefinition) return false

        return true
      }
      case 'TypeArgList': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.InstantiationExpression) return false

        if (
          node.matchContext(
            javascriptSyntaxNodeNames(
              'VariableDeclaration',
              'TypeAnnotation',
              'ParameterizedType',
            ).get(),
          )
        )
          return true

        if (
          node.matchContext(javascriptSyntaxNodeNames('TypeAnnotation', 'ParameterizedType').get())
        )
          return false

        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.ClassDeclaration) return false

        return true
      }
      case 'ObjectExpression': {
        if (
          parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.Property &&
          this.utils.getMatchedBrackets({ node: node.parent, matchCase: '[]' }).result.has !== null
        ) {
          return false
        }

        return true
      }
      case 'MemberExpression': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.MemberExpression) return false
        if (node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME['['])) return true

        return false
      }
      case 'Property': {
        if (node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ParamList)) return true
        if (this.utils.getMatchedBrackets({ node, matchCase: '[]' }).result.has !== null)
          return true

        return false
      }
      case 'NewExpression': {
        if (
          !node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ParenthesizedExpression) &&
          node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ArgList)
        )
          return true

        return false
      }
      case 'CallExpression': {
        if (node.prevSibling?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.Arrow) return false

        return true
      }
      case 'ArrowFunction': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.ArrowFunction) return false

        return true
      }
      case 'ParenthesizedExpression': {
        if (
          javascriptSyntaxNodeNames(
            'WhileStatement',
            'DoStatement',
            'WithStatement',
            'IfStatement',
            'CallExpression',
            'ArrowFunction',
            'SwitchStatement',
          )
            .get()
            .includes(parentNodeName ?? '')
        )
          return false

        return true
      }
      case 'ArrayType': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.ArrayType) return false
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.TypeAnnotation) {
          if (node.parent?.parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.PropertyType) return true
          if (node.parent?.parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.VariableDeclaration)
            return true

          return false
        }

        return true
      }
      case 'ArrayExpression': {
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.PropertyDeclaration) return false
        if (parentNodeName === JAVA_SCRIPT_SYNTAXNODE_NAME.ArrowFunction) return false

        return true
      }
      case 'TupleType': {
        if (
          node.matchContext(
            javascriptSyntaxNodeNames('FunctionDeclaration', 'TypeAnnotation').get(),
          ) ||
          node.matchContext(javascriptSyntaxNodeNames('ArrowFunction', 'TypeAnnotation').get())
        ) {
          return false
        }

        return true
      }
    }

    return false
  }

  getBracketTokens: ({
    tree,
    state,
    node,
  }: {
    tree: Tree
    state: EditorState
    node: SyntaxNode
  }) => BracketTokens = ({ tree, state, node }) => {
    const name = node.name as JavaScriptSyntaxNodeName

    const bracketTokens = BaseBracketPairView.initialBracketTokens()

    switch (name) {
      case 'ImportGroup':
      case 'ExportGroup': {
        const groupCulryBrace = this.utils.getMatchedBrackets({
          node,
          matchCase: '{}',
        })

        groupCulryBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'ForStatement': {
        const spec =
          node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ForSpec) ??
          node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ForInSpec) ??
          node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ForOfSpec)

        const [specParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node: spec,
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        specParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'WhileStatement': {
        const [parenthesizedExpressionParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParenthesizedExpression').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        parenthesizedExpressionParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'DoStatement': {
        const [blockCurlyBrace, parenthesizedExpressionParenthesis] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParenthesizedExpression').get(),
            matchCase: '()',
          }),
        ]

        blockCurlyBrace.applyToBracketTokens(bracketTokens)
        parenthesizedExpressionParenthesis.applyToBracketTokens(bracketTokens)

        break
      }
      case 'WithStatement': {
        const [parenthesizedExpressionParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParenthesizedExpression').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        parenthesizedExpressionParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'SwitchStatement': {
        const [parenthesizedExpressionParenthesis, switchBodyBlockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParenthesizedExpression').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('SwitchBody').get(),
            matchCase: '{}',
          }),
        ]

        parenthesizedExpressionParenthesis.applyToBracketTokens(bracketTokens)
        switchBodyBlockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'Block': {
        if (node.parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.SwitchBody) {
          const blockCurlyBrace = this.utils.getMatchedBrackets({
            node,
            matchCase: '{}',
          })

          if (blockCurlyBrace.result.has === 'both') {
            blockCurlyBrace.applyToBracketTokens(bracketTokens)
          }
        }

        break
      }
      case 'IfStatement': {
        const [parenthesizedExpressionParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParenthesizedExpression').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        parenthesizedExpressionParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'TryStatement': {
        const [
          tryBlockCurlyBrace,
          catchClauseParenthesis,
          catchClauseBlockCurlyBrace,
          finallyClauseCurlyBrace,
        ] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('CatchClause').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('CatchClause', 'Block').get(),
            matchCase: '{}',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('FinallyClause', 'Block').get(),
            matchCase: '{}',
          }),
        ]

        tryBlockCurlyBrace.applyToBracketTokens(bracketTokens)

        catchClauseParenthesis.applyToBracketTokens(bracketTokens)
        catchClauseBlockCurlyBrace.applyToBracketTokens(bracketTokens)

        finallyClauseCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'FunctionDeclaration': {
        const [paramListParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParamList').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        paramListParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'CallExpression': {
        const [parenthesizedExpressionParenthesis, paramListParenthesis, argListParenthesis] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParenthesizedExpression').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ArrowFunction', 'ParamList').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ArgList').get(),
            matchCase: '()',
          }),
        ]

        // --- iife ---

        // ()()
        if (
          !parenthesizedExpressionParenthesis.result.target &&
          paramListParenthesis.result.has === 'both' &&
          argListParenthesis.result.has === 'both'
        ) {
          paramListParenthesis.applyToBracketTokens(bracketTokens)
          argListParenthesis.applyToBracketTokens(bracketTokens)

          break
        }

        // (() => {...})()
        if (
          parenthesizedExpressionParenthesis.result.has === 'both' &&
          argListParenthesis.result.has === 'both'
        ) {
          parenthesizedExpressionParenthesis.applyToBracketTokens(bracketTokens)
          argListParenthesis.applyToBracketTokens(bracketTokens)

          break
        }

        // ------------

        if (argListParenthesis.result.has === 'both') {
          argListParenthesis.applyToBracketTokens(bracketTokens)
        }

        break
      }
      case 'ArrowFunction': {
        const [paramListParenthesis, arrow, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParamList').get(),
            matchCase: '()',
          }),
          node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.Arrow),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        paramListParenthesis.applyToBracketTokens(bracketTokens)
        arrow && bracketTokens.arrow.push(arrow)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'ParenthesizedExpression': {
        if (
          node.prevSibling?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.new &&
          node.nextSibling?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.ArgList
        ) {
          const [parenthesis, argListParenthesis] = [
            this.utils.getMatchedBrackets({
              node,
              matchCase: '()',
            }),
            this.utils.getMatchedBrackets({
              node: node.nextSibling,
              matchCase: '()',
            }),
          ]

          parenthesis.applyToBracketTokens(bracketTokens)
          argListParenthesis.applyToBracketTokens(bracketTokens)

          break
        }

        const parenthesis = this.utils.getMatchedBrackets({
          node,
          matchCase: '()',
        })

        parenthesis.applyToBracketTokens(bracketTokens)

        break
      }
      case 'NewExpression': {
        if (!this.applyDepth({ tree, state, node })) {
          break
        }

        const argListParenthesis = this.utils.getMatchedBrackets({
          node,
          childContext: javascriptSyntaxNodeNames('ArgList').get(),
          matchCase: '()',
        })

        argListParenthesis.applyToBracketTokens(bracketTokens)

        break
      }
      case 'FunctionExpression': {
        const [paramListParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParamList').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        paramListParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'FunctionSignature': {
        const [paramListParenthesis, arrow] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParamList').get(),
            matchCase: '()',
          }),
          node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.Arrow),
        ]

        paramListParenthesis.applyToBracketTokens(bracketTokens)
        arrow && bracketTokens.arrow.push(arrow)

        break
      }
      case 'IndexSignature':
      case 'IndexedType': {
        const indexSquareBracket = this.utils.getMatchedBrackets({
          node,
          matchCase: '[]',
        })

        indexSquareBracket.applyToBracketTokens(bracketTokens)

        break
      }
      case 'MemberExpression': {
        const indexSquareBracket = this.utils.getMatchedBrackets({
          node,
          matchCase: '[]',
        })

        indexSquareBracket.applyToBracketTokens(bracketTokens)

        break
      }
      case 'Property': {
        const [squareBracket, paramListParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({ node, matchCase: '[]' }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParamList').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        squareBracket.applyToBracketTokens(bracketTokens)

        paramListParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'EnumDeclaration': {
        const enumBodyBlockCurlyBrace = this.utils.getMatchedBrackets({
          node,
          childContext: javascriptSyntaxNodeNames('EnumBody').get(),
          matchCase: '{}',
        })

        enumBodyBlockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'ObjectType':
      case 'ObjectPattern':
      case 'ObjectExpression': {
        const objectCurlyBrace = this.utils.getMatchedBrackets({
          node,
          matchCase: '{}',
        })

        objectCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'ClassExpression':
      case 'ClassDeclaration': {
        const blockCurlyBrace = this.utils.getMatchedBrackets({
          node,
          childContext: javascriptSyntaxNodeNames('ClassBody').get(),
          matchCase: '{}',
        })

        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'MethodDeclaration': {
        const [paramListParenthesis, blockCurlyBrace] = [
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('ParamList').get(),
            matchCase: '()',
          }),
          this.utils.getMatchedBrackets({
            node,
            childContext: javascriptSyntaxNodeNames('Block').get(),
            matchCase: '{}',
          }),
        ]

        paramListParenthesis.applyToBracketTokens(bracketTokens)
        blockCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'JSXEscape': {
        const jsxEscapeCurlyBrace = this.utils.getMatchedBrackets({
          node,
          matchCase: '{}',
        })

        jsxEscapeCurlyBrace.applyToBracketTokens(bracketTokens)

        break
      }
      case 'ParenthesizedType': {
        const parenthesis = this.utils.getMatchedBrackets({
          node,
          matchCase: '()',
        })

        parenthesis.applyToBracketTokens(bracketTokens)

        break
      }
      case 'TupleType':
      case 'ArrayType':
      case 'ArrayPattern':
      case 'ArrayExpression': {
        const arraySquareBracket = this.utils.getMatchedBrackets({
          node,
          matchCase: '[]',
        })

        arraySquareBracket.applyToBracketTokens(bracketTokens)

        break
      }
      case 'TypeParamList': {
        const typeAngleBracket = this.utils.getMatchedBrackets({
          node,
          matchCase: '<>',
        })

        typeAngleBracket.applyToBracketTokens(bracketTokens)

        break
      }
      case 'TypeArgList': {
        const typeAngleBracket = this.utils.getMatchedBrackets({
          node,
          matchCase: '<>',
        })

        typeAngleBracket.applyToBracketTokens(bracketTokens)

        break
      }
      case '⚠': {
        // error node

        if (node.parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXEscape) {
          const maybeJSXEscapeCloseCurlyBrace =
            state.doc
              .sliceString(node.from, node.from === node.to ? node.from + 1 : node.to)
              .trim() === '}'

          if (maybeJSXEscapeCloseCurlyBrace) {
            const targetType = this.utils.getType(tree, '}')

            const closeCurlyBraceNode: SyntaxNode = {
              ...node,
              type: targetType ?? node.type,
              from: node.from,
              to: node.from === node.to ? node.from + 1 : node.to,
            }

            bracketTokens['}'].push(closeCurlyBraceNode)

            break
          }
        }

        break
      }
    }

    return {
      ...bracketTokens,
    }
  }
}

// jsBracketPair extension

export const jsBracketPair = (config?: BracketPairPluginConfig) => {
  return bracketPair(JsBracketPairView, config)
}

//

const nodeIsIIFE = (node: SyntaxNode) => {
  const name = node.name as JavaScriptSyntaxNodeName

  if (name !== JAVA_SCRIPT_SYNTAXNODE_NAME.CallExpression) return false

  const parenthesizedExpression = node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ParenthesizedExpression)

  const paramList = node
    .getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ArrowFunction)
    ?.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ParamList)
  const argList = node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.ArgList)

  if (!parenthesizedExpression && paramList && argList) {
    const paramListParenthesis = getMatchedParenthesis(paramList)
    const argListParenthesis = getMatchedParenthesis(argList)

    if (paramListParenthesis && argListParenthesis) {
      return true
    }

    return false
  }

  if (parenthesizedExpression && argList) {
    const parenthesizedExpressionParenthesis = getMatchedParenthesis(parenthesizedExpression)
    const argListParenthesis = getMatchedParenthesis(argList)

    if (parenthesizedExpressionParenthesis && argListParenthesis) return true

    return false
  }

  return false
}

const getMatchedParenthesis = (node: SyntaxNode) => {
  const open = node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME['('])
  const close = node.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME[')'])

  if (open && close) {
    return {
      open,
      close,
    }
  }

  return null
}
