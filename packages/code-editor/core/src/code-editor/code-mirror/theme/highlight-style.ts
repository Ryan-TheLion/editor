import { TagStyle } from '@codemirror/language'
import { highlightTags } from '../tags'

export const codeEditorLightThemeSyntaxHighlight: () => TagStyle[] = () => {
  const keywordStyle: TagStyle[] = [
    { tag: [highlightTags.keyword], color: '#7c5ae3' },
    {
      tag: [
        highlightTags.self,
        highlightTags.atom,
        highlightTags.language.js.keyword.new,
        highlightTags.language.js.keyword['keyof/typeof'],
      ],
      color: '#427e74',
    },
    { tag: highlightTags.moduleKeyword, color: '#5670fb' },
  ]

  const operatorStyle: TagStyle[] = [
    { tag: highlightTags.operator, color: '#de983e' },
    { tag: highlightTags.logicOperator, color: '#c225ac' },
    { tag: highlightTags.derefOperator, color: '#7c5ae3' },
    { tag: highlightTags.language.js.spread, color: '#427e74' },
  ]

  const variableStyle: TagStyle[] = [
    { tag: highlightTags.language.js.variable.moduleIdentifier, color: '#151515' },
    { tag: highlightTags.variableName, color: '#d89292' },
    { tag: highlightTags.definition(highlightTags.variableName), color: '#2f5dd9' },
    {
      tag: [
        highlightTags.language.js.variable.name,
        highlightTags.language.js.variable.functionName,
      ],
      color: '#85A600',
    },
    { tag: highlightTags.language.js.variable.objectIdentifier, color: '#ffa500' },
    { tag: highlightTags.language.js.variable.propertyName, color: '#ef7560' },
    { tag: highlightTags.language.js.variable.memberProperty, color: '#FF7F50' },
    {
      tag: [
        highlightTags.language.js.variable.inArgList,
        highlightTags.language.js.variable.inArray,
      ],
      color: '#ef83d1',
    },
    { tag: highlightTags.language.js.variable.fieldDeclaration, color: '#ef7560' },
    { tag: highlightTags.labelName, color: '#f39822' },
    { tag: highlightTags.className, color: '#962bdd' },
    { tag: highlightTags.definition(highlightTags.className), color: '#ff9b1b' },
    { tag: [highlightTags.number, highlightTags.attributeName], color: '#f39822' },
    { tag: [highlightTags.bool, highlightTags.null], color: '#ff5370' },
  ]

  const typeStyle: TagStyle[] = [
    { tag: highlightTags.typeName, color: '#ff7f50' },
    { tag: highlightTags.definition(highlightTags.typeName), color: '#ffa500' },
    { tag: highlightTags.language.js.variable.propertyType, color: '#ef7560' },
  ]

  const tagStyle: TagStyle[] = [
    { tag: highlightTags.tagName, color: '#0971F1' },
    {
      tag: highlightTags.language.js.tagAngleBracket,
      color: '#151515',
      fontFamily: '"IBM Plex Mono", monospace',
      fontStyle: 'normal',
    },
  ]

  const jsxStyle: TagStyle[] = [{ tag: highlightTags.language.js.jsxText, color: '#151515' }]

  return [
    ...keywordStyle,
    ...operatorStyle,
    ...variableStyle,
    ...typeStyle,
    ...tagStyle,
    ...jsxStyle,
    { tag: highlightTags.separator, color: '#ea92cd' },
    { tag: highlightTags.language.js.colon, color: '#427e74' },
    { tag: highlightTags.special(highlightTags.brace), color: '#da5367' },
    { tag: highlightTags.string, color: '#2874f3' },
    { tag: highlightTags.comment, color: '#999999' },
    { tag: highlightTags.unit, color: '#bb9af7' },
  ]
}

export const codeEditorDarkThemeSyntaxHighlight: () => TagStyle[] = () => {
  const keywordStyle: TagStyle[] = [
    { tag: [highlightTags.keyword], color: '#ebbbff' },
    {
      tag: [
        highlightTags.self,
        highlightTags.atom,
        highlightTags.language.js.keyword.new,
        highlightTags.language.js.keyword['keyof/typeof'],
      ],
      color: '#73daca',
    },
    { tag: highlightTags.moduleKeyword, color: '#adeaf4' },
  ]

  const operatorStyle: TagStyle[] = [
    { tag: highlightTags.operator, color: '#ffad5c' },
    { tag: highlightTags.logicOperator, color: '#25aac2' },
    { tag: highlightTags.derefOperator, color: '#c792ea' },
    { tag: highlightTags.language.js.spread, color: '#73daca' },
  ]

  const variableStyle: TagStyle[] = [
    { tag: highlightTags.language.js.variable.moduleIdentifier, color: '#eeebff' },
    { tag: highlightTags.variableName, color: '#eeebff' },
    { tag: highlightTags.definition(highlightTags.variableName), color: '#eeebff' },
    {
      tag: [
        highlightTags.language.js.variable.name,
        highlightTags.language.js.variable.functionName,
      ],
      color: '#bbdaff',
    },
    { tag: highlightTags.language.js.variable.objectIdentifier, color: '#9eebb3' },
    { tag: highlightTags.language.js.variable.propertyName, color: '#c3a9f1' },
    { tag: highlightTags.language.js.variable.memberProperty, color: '#7dd7c9' },
    {
      tag: [
        highlightTags.language.js.variable.inArgList,
        highlightTags.language.js.variable.inArray,
      ],
      color: '#eeebff',
    },
    { tag: highlightTags.labelName, color: '#ffcc99' },
    { tag: highlightTags.language.js.variable.fieldDeclaration, color: '#eeebff' },
    { tag: highlightTags.className, color: '#c792ea' },
    { tag: highlightTags.definition(highlightTags.className), color: '#ffcb8b' },
    { tag: [highlightTags.number, highlightTags.attributeName], color: '#ffcc99' },
    { tag: [highlightTags.bool, highlightTags.null], color: '#ff5370' },
  ]

  const typeStyle: TagStyle[] = [
    { tag: highlightTags.typeName, color: '#ffcb8b' },
    { tag: highlightTags.definition(highlightTags.typeName), color: '#ffeead' },
    { tag: highlightTags.language.js.variable.propertyType, color: '#c3a9f1' },
  ]

  const tagStyle: TagStyle[] = [
    { tag: highlightTags.tagName, color: '#caece6' },
    {
      tag: highlightTags.language.js.tagAngleBracket,
      color: '#6ae9f0',
      fontFamily: '"IBM Plex Mono", monospace',
      fontStyle: 'normal',
    },
  ]

  const jsxStyle: TagStyle[] = [{ tag: highlightTags.language.js.jsxText, color: '#eeebff' }]

  return [
    ...keywordStyle,
    ...operatorStyle,
    ...variableStyle,
    ...typeStyle,
    ...tagStyle,
    ...jsxStyle,
    { tag: highlightTags.separator, color: '#c792ea' },
    { tag: highlightTags.language.js.colon, color: '#73daca' },
    { tag: highlightTags.special(highlightTags.brace), color: '#d43950' },
    { tag: highlightTags.string, color: '#d1f1a9' },
    { tag: highlightTags.comment, color: '#6c6783' },
    { tag: highlightTags.unit, color: '#bb9af7' },
  ]
}
