export type JavaScriptSyntaxNodeName =
  | 'Script'
  | 'Hashbang'
  | 'ParenthesizedExpression'
  | 'BinaryExpression'
  | 'ConditionalExpression'
  | 'AssignmentExpression'
  | 'PostfixExpression'
  | 'InstantiationExpression'
  | 'SequenceExpression'
  | 'UnaryExpression'
  | 'RegExp'
  | 'Spread'
  | Statement
  | Types
  | Variable
  | Func
  | Class
  | Obj
  | Arr
  | JSX
  | Operator
  | Comment
  | This
  | Str
  | Bool
  | Num
  | Null
  | Void
  | 'default'
  | 'accessor'
  | 'using'
  | 'out'
  | 'Star'
  | 'Block'
  | '('
  | ')'
  | '{'
  | '}'
  | '<'
  | '>'
  | '['
  | ']'
  | ','
  | ';'
  | '⚠'

// typescript

type Types =
  | 'type'
  | 'TypeDefinition'
  | 'TypeAliasDeclaration'
  | 'LiteralType'
  | 'InterfaceDeclaration'
  | 'interface'
  | 'InferredType'
  | 'infer'
  | 'as'
  | 'EnumDeclaration'
  | 'enum'
  | 'EnumBody'
  | 'NamespaceDeclaration'
  | 'namespace'
  | 'module'
  | 'TypeParamList'
  | 'TypeArgList'
  | 'TypeAnnotation'
  | 'TypeName'
  | 'TypePredicate'
  | 'NewSignature'
  | 'IndexedType'
  | 'IndexSignature'
  | 'UnionType'
  | 'IntersectionType'
  | 'ConditionalType'
  | 'ParenthesizedType'
  | 'ParameterizedType'
  | 'TupleType'
  | 'ArrayType'
  | 'ObjectType'
  | 'MethodType'
  | 'PropertyType'
  | 'ReadonlyType'
  | 'readonly'
  | 'Optional'
  | ':'
  | 'PrefixCast'
  | 'AmbientDeclaration'
  | 'AmbientFunctionDeclaration'
  | 'declare'
  | 'GlobalDeclaration'
  | 'global'
  | 'UniqueType'
  | 'unique'
  | 'TypeofType'
  | 'typeof'
  | 'KeyofType'
  | 'keyof'
  | 'asserts'
  | 'is'

// variable

type Variable =
  | 'VariableDefinition'
  | 'VariableDeclaration'
  | 'VariableName'
  | 'const'
  | 'let'
  | 'var'

// function

type Func =
  | 'CallExpression'
  | 'FunctionSignature'
  | 'FunctionExpression'
  | 'FunctionDeclaration'
  | 'ArgList'
  | 'ParamList'
  | 'ArrowFunction'
  | 'Arrow'
  | 'async'
  | 'AwaitExpression'
  | 'await'
  | 'function'
  | 'YieldExpression'
  | 'yield'

// class

type Class =
  | 'ClassExpression'
  | 'ClassDeclaration'
  | 'abstract'
  | 'class'
  | 'ClassBody'
  | 'extends'
  | 'implements'
  | 'NewTarget'
  | 'NewExpression'
  | 'new'
  | 'super'
  | 'static'
  | 'StaticBlock'
  | 'Privacy'
  | 'override'
  | 'MethodDeclaration'
  | 'PropertyDeclaration'
  | 'PrivatePropertyDefinition'
  | 'PrivatePropertyName'
  | 'instanceof'
  | 'Decorator'
  | '@'

// object

type Obj =
  | 'ObjectExpression'
  | 'ObjectPattern'
  | 'PatternProperty'
  | 'Property'
  | 'PropertyName'
  | 'PropertyDefinition'
  | 'MemberExpression'
  | 'get'
  | 'set'
  | 'delete'
  | 'satisfies'
  | '.'
  | '?.'

// array

type Arr = 'ArrayExpression' | 'ArrayPattern'

// operator

type Operator = 'ArithOp' | 'LogicOp' | 'BitOp' | 'CompareOp' | 'UpdateOp' | 'Equals'

// comment

type Comment = 'LineComment' | 'BlockComment'

// jsx

type JSX =
  | 'JSXElement'
  | 'JSXOpenTag'
  | 'JSXStartTag'
  | 'JSXEndTag'
  | 'JSXCloseTag'
  | 'JSXStartCloseTag'
  | 'JSXSelfClosingTag'
  | 'JSXSelfCloseEndTag'
  | 'JSXFragmentTag'
  | 'JSXBuiltin'
  | 'JSXIdentifier'
  | 'JSXNamespacedName'
  | 'JSXMemberExpression'
  | 'JSXAttribute'
  | 'JSXSpreadAttribute'
  | 'JSXAttributeValue'
  | 'JSXEscape'
  | 'JSXText'

// this

type This = 'ThisType' | 'this'

// string

type Str =
  | 'String'
  | 'Escape'
  | 'TaggedTemplateExpression'
  | 'TemplateType'
  | 'TemplateString'
  | 'Interpolation'
  | 'InterpolationStart'
  | 'InterpolationEnd'

// boolean

type Bool = 'BooleanLiteral'

// number

type Num = 'Number'

// null

type Null = 'NullType' | 'null'

// void

type Void = 'VoidType' | 'void'

// statement

type Statement =
  | Import
  | Export
  | 'from'
  | ForStatement
  | WhileStatement
  | WithStatement
  | DoStatement
  | IfStatement
  | SwitchStatement
  | TryStatement
  | ReturnStatement
  | ThrowStatement
  | BreakStatement
  | ContinueStatement
  | DebuggerStatement
  | LabeledStatement
  | ExpressionStatement

type Import =
  | 'ImportDeclaration'
  | 'ImportType'
  | 'import'
  | 'ImportGroup'
  | 'DynamicImport'
  | 'ImportMeta'

type Export = 'ExportDeclaration' | 'export' | 'ExportGroup'

type ForStatement = 'ForStatement' | 'for' | 'ForSpec' | 'ForInSpec' | 'ForOfSpec' | 'of'

type WhileStatement = 'WhileStatement' | 'while'

type WithStatement = 'WithStatement' | 'with'

type DoStatement = 'DoStatement' | 'do'

type IfStatement = 'IfStatement' | 'if' | 'else'

type SwitchStatement =
  | 'SwitchStatement'
  | 'switch'
  | 'SwitchBody'
  | 'CaseLabel'
  | 'case'
  | 'DefaultLabel'

type TryStatement = 'TryStatement' | 'try' | 'CatchClause' | 'catch' | 'FinallyClause' | 'finally'

type ReturnStatement = 'ReturnStatement' | 'return'

type ThrowStatement = 'ThrowStatement' | 'throw'

type BreakStatement = 'BreakStatement' | 'break'

type ContinueStatement = 'ContinueStatement' | 'continue'

type DebuggerStatement = 'DebuggerStatement' | 'debugger'

type LabeledStatement = 'LabeledStatement' | 'Label'

type ExpressionStatement = 'ExpressionStatement' | 'SingleExpression' | 'SingleClassItem'
