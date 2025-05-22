import { styleTags } from '@lezer/highlight'
import { highlightTags } from '../../tags'
import { NodeProp } from '@lezer/common'
import { LanguageSupport, LRLanguage } from '@codemirror/language'
import {
  javascriptLanguage,
  jsxLanguage,
  tsxLanguage,
  typescriptLanguage,
} from '@codemirror/lang-javascript'
import {
  JAVA_SCRIPT_SYNTAXNODE_NAME,
  javascriptSyntaxNodeNames,
  javaScriptSyntaxNodeNameSelector,
} from './node-name'

export * from './node-name'

export * from './node-type'

const extendJsStyleTags = styleTags({
  [JAVA_SCRIPT_SYNTAXNODE_NAME.VariableName]: highlightTags.variableName,
  [javaScriptSyntaxNodeNameSelector(
    ['ImportDeclaration', 'VariableDefinition'],
    ['ImportDeclaration', 'ImportGroup', 'VariableDefinition'],
    ['ImportDeclaration', 'ImportGroup', 'VariableName'],
    ['ExportDeclaration', 'VariableName'],
    ['ExportDeclaration', 'ExportGroup', 'VariableName'],
  )]: highlightTags.language.js.variable.moduleIdentifier,
  [javaScriptSyntaxNodeNameSelector(['MemberExpression', 'VariableName'])]:
    highlightTags.language.js.variable.objectIdentifier,
  [javaScriptSyntaxNodeNameSelector(
    ['PropertyName'],
    ['PropertyDeclaration', 'PropertyDefinition'],
    ['PrivatePropertyDefinition'],
  )]: highlightTags.language.js.variable.fieldDeclaration,
  [javaScriptSyntaxNodeNameSelector(
    ['ClassBody', 'MethodDeclaration', 'PropertyDefinition'],
    ['ClassBody', 'MethodDeclaration', 'PrivatePropertyDefinition'],
    ['FunctionDeclaration', 'VariableDefinition'],
    ['CallExpression', 'VariableName'],
    ['CallExpression', 'InstantiationExpression', 'VariableName'],
    ['CallExpression', 'MemberExpression', 'PropertyName'],
  )]: highlightTags.language.js.variable.functionName,
  [javaScriptSyntaxNodeNameSelector(
    ['VariableDeclaration', 'VariableDefinition'],
    ['JSXEscape', 'VariableName'],
  )]: highlightTags.language.js.variable.name,
  [javaScriptSyntaxNodeNameSelector(
    ['ReturnStatement', 'ObjectExpression', 'Property', 'PropertyDefinition'],
    ['ForSpec', 'VariableDeclaration', 'VariableDefinition'],
    ['ForOfSpec', 'VariableDefinition'],
    ['ForInSpec', 'VariableDefinition'],
    ['ForOfSpec', 'VariableDefinition'],
  )]: highlightTags.definition(highlightTags.variableName),
  [javaScriptSyntaxNodeNameSelector(
    ['ClassDeclaration', 'VariableDefinition'],
    ['NewExpression', 'VariableName'],
    ['NewExpression', 'InstantiationExpression', 'VariableName'],
  )]: highlightTags.definition(highlightTags.className),
  [javaScriptSyntaxNodeNameSelector(
    ['CatchClause', 'VariableDefinition'],
    ['ParamList', 'VariableDefinition'],
    ['ArgList', 'VariableName'],
    ['ParenthesizedExpression', 'VariableName'],
    ['ParenthesizedExpression', 'UnaryExpression', 'VariableName'],
  )]: highlightTags.language.js.variable.inArgList,
  [javaScriptSyntaxNodeNameSelector(
    ['ArrayPattern', 'VariableDefinition'],
    ['ArrayExpression', 'VariableName'],
    ['VariableDeclaration', 'ArrayPattern', 'VariableDefinition'],
  )]: highlightTags.language.js.variable.inArray,
  [javaScriptSyntaxNodeNameSelector(
    ['PropertyDefinition'],
    ['ObjectExpression', 'Property', 'PropertyDefinition'],
  )]: highlightTags.language.js.variable.propertyName,
  [javaScriptSyntaxNodeNameSelector(
    ['PropertyType'],
    ['ParamList', 'ObjectPattern', 'PatternProperty', 'PropertyName'],
    ['ArgList', 'ObjectExpression', 'Property', 'PropertyDefinition'],
    ['ObjectType', 'PropertyType', 'PropertyDefinition'],
  )]: highlightTags.language.js.variable.propertyType,
  [javaScriptSyntaxNodeNameSelector(
    ['MemberExpression', 'PropertyName'],
    ['MemberExpression', 'PrivatePropertyName'],
  )]: highlightTags.language.js.variable.memberProperty,
  [javaScriptSyntaxNodeNameSelector(
    ['JSXFragmentTag', 'JSXStartTag'],
    ['JSXFragmentTag', 'JSXEndTag'],
    ['JSXSelfClosingTag', 'JSXStartTag'],
    ['JSXSelfClosingTag', 'JSXSelfCloseEndTag'],
    ['JSXOpenTag', 'JSXStartTag'],
    ['JSXOpenTag', 'JSXEndTag'],
    ['JSXCloseTag', 'JSXStartCloseTag'],
    ['JSXCloseTag', 'JSXEndTag'],
  )]: highlightTags.language.js.tagAngleBracket,
  [JAVA_SCRIPT_SYNTAXNODE_NAME.JSXText]: highlightTags.language.js.jsxText,
  [javaScriptSyntaxNodeNameSelector(['TypeName'], ['void'])]: highlightTags.typeName,
  [JAVA_SCRIPT_SYNTAXNODE_NAME.new]: highlightTags.language.js.keyword.new,
  [javaScriptSyntaxNodeNameSelector(['keyof'], ['typeof'])]:
    highlightTags.language.js.keyword['keyof/typeof'],
  [javaScriptSyntaxNodeNameSelector(
    [':'],
    ['ParamList', 'Optional'],
    ['PropertyType', 'Optional'],
    ['PropertyDeclaration', 'Optional'],
    ['PropertyDeclaration', 'LogicOp'],
  )]: highlightTags.language.js.colon,
  [JAVA_SCRIPT_SYNTAXNODE_NAME.LogicOp]: highlightTags.logicOperator,
  [JAVA_SCRIPT_SYNTAXNODE_NAME['?.']]: highlightTags.derefOperator,
  [JAVA_SCRIPT_SYNTAXNODE_NAME.Spread]: highlightTags.language.js.spread,
})

const jsxBracketNodeProp = [
  NodeProp.openedBy.add({
    [JAVA_SCRIPT_SYNTAXNODE_NAME.JSXEndTag]: javascriptSyntaxNodeNames(
      'JSXStartTag',
      'JSXStartCloseTag',
    ).get(),
    [JAVA_SCRIPT_SYNTAXNODE_NAME.JSXSelfCloseEndTag]: javascriptSyntaxNodeNames(
      'JSXStartTag',
      'JSXFragmentTag',
    ).get(),
  }),
  NodeProp.closedBy.add({
    [JAVA_SCRIPT_SYNTAXNODE_NAME.JSXStartTag]: javascriptSyntaxNodeNames(
      'JSXEndTag',
      'JSXSelfCloseEndTag',
    ).get(),
    [JAVA_SCRIPT_SYNTAXNODE_NAME.JSXStartCloseTag]: javascriptSyntaxNodeNames('JSXEndTag').get(),
    [JAVA_SCRIPT_SYNTAXNODE_NAME.JSXFragmentTag]:
      javascriptSyntaxNodeNames('JSXSelfCloseEndTag').get(),
  }),
]

const languageData = {
  closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] },
  commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
  wordChars: '$',
}

export const jsLanguageSupports = {
  javascript: new LanguageSupport(
    LRLanguage.define({
      parser: javascriptLanguage.parser.configure({
        props: [extendJsStyleTags],
      }),
      languageData,
      name: javascriptLanguage.name,
    }),
  ),
  typescript: new LanguageSupport(
    LRLanguage.define({
      parser: typescriptLanguage.parser.configure({
        props: [extendJsStyleTags],
      }),
      languageData,
      name: typescriptLanguage.name,
    }),
  ),
  jsx: new LanguageSupport(
    LRLanguage.define({
      parser: jsxLanguage.parser.configure({
        props: [extendJsStyleTags, ...jsxBracketNodeProp],
      }),
      languageData,
      name: 'jsx',
    }),
  ),
  tsx: new LanguageSupport(
    LRLanguage.define({
      parser: tsxLanguage.parser.configure({
        props: [extendJsStyleTags, ...jsxBracketNodeProp],
      }),
      languageData,
      name: 'tsx',
    }),
  ),
}
