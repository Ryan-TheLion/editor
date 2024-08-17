import { HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

import { codeEditorDarkThemeColors, codeEditorLightThemeColors } from './colors'

export const codeEditorLightThemeHighlight = HighlightStyle.define([
  {
    tag: tags.definition(tags.variableName),
    color: codeEditorLightThemeColors.highlight.definition,
  },
  {
    tag: tags.function(tags.variableName),
    color: codeEditorLightThemeColors.highlight.functionName,
  },
  { tag: tags.keyword, color: codeEditorLightThemeColors.highlight.keyword },
  { tag: tags.string, color: codeEditorLightThemeColors.highlight.string },
  { tag: tags.bool, color: codeEditorLightThemeColors.highlight.bool },
  { tag: tags.comment, color: codeEditorLightThemeColors.highlight.comment },
  { tag: tags.typeName, color: codeEditorLightThemeColors.highlight.typeName },
])

export const codeEditorDarkThemeHighlight = HighlightStyle.define([
  {
    tag: tags.definition(tags.variableName),
    color: codeEditorDarkThemeColors.highlight.definition,
  },
  {
    tag: tags.function(tags.variableName),
    color: codeEditorDarkThemeColors.highlight.functionName,
  },
  { tag: tags.keyword, color: codeEditorDarkThemeColors.highlight.keyword },
  { tag: tags.string, color: codeEditorDarkThemeColors.highlight.string },
  { tag: tags.bool, color: codeEditorDarkThemeColors.highlight.bool },
  { tag: tags.comment, color: codeEditorDarkThemeColors.highlight.comment },
  { tag: tags.typeName, color: codeEditorDarkThemeColors.highlight.typeName },
])
