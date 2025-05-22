import { bracketMatching, Config, syntaxTree } from '@codemirror/language'
import { EditorView, Decoration } from '@codemirror/view'
import { COLOR } from '../theme/colors'
import { CodeMirrorStyleSpec, CodeMirrorThemeSpec, EditorThemeMode } from '../theme/editor-theme'
import { overrideObject } from '../../../utils'
import { JAVA_SCRIPT_SYNTAXNODE_NAME, javascriptSyntaxNodeNames } from '../languages/js'

type OverrideStyleSpec = {
  light?: CodeMirrorStyleSpec
  dark?: CodeMirrorStyleSpec
}

const matchingBracketMark = Decoration.mark({
  class: 'cm-matchingBracket',
})

export const highlightMatchedBracket = ({
  styleSpec,
  ...config
}: Partial<Config> & {
  styleSpec?: OverrideStyleSpec
} = {}) => {
  const getSpec = ({
    spec,
    mode,
  }: {
    spec: CodeMirrorStyleSpec
    mode: EditorThemeMode
  }): CodeMirrorThemeSpec | null => {
    if (!Object.keys(spec).length) return null

    const { color, ...specs } = spec

    return {
      [`&${mode}.cm-focused .cm-matchingBracket`]: {
        ...specs,
      },
      [`&${mode}.cm-focused .cm-matchingBracket > *`]: {
        color,
      },
    } as CodeMirrorThemeSpec
  }

  const overrideSpec = (baseSpec: CodeMirrorThemeSpec, sourceSpec?: CodeMirrorThemeSpec | null) => {
    return overrideObject(baseSpec, sourceSpec)
  }

  const defaultSpec: CodeMirrorThemeSpec = {
    '&light.cm-focused .cm-matchingBracket': {
      border: '1px solid #3A8DF34D',
      backgroundColor: COLOR.transparent,
    },
    '&dark.cm-focused .cm-matchingBracket': {
      border: '1px solid #ffa50096',
      backgroundColor: COLOR.transparent,
    },
  }

  const themeSpec = (() => {
    let result = {
      ...defaultSpec,
    }

    if (styleSpec?.light) {
      result = overrideSpec(result, getSpec({ spec: styleSpec.light, mode: 'light' }))
    }

    if (styleSpec?.dark) {
      result = overrideSpec(result, getSpec({ spec: styleSpec.dark, mode: 'dark' }))
    }

    return result
  })()

  return [
    EditorView.baseTheme(themeSpec),
    bracketMatching({
      ...config,
      renderMatch: config.renderMatch ?? bracketMatchingHandler,
    }),
  ]
}

const bracketMatchingHandler: NonNullable<Config['renderMatch']> = (match, state) => {
  const tree = syntaxTree(state)

  if (match.matched) {
    const startNode = tree.resolve(match.start.from, 1)
    const endNode = tree.resolve(match.end!.from, 1)

    if (javascriptSyntaxNodeNames('TemplateString', 'JSXText').get().includes(startNode.name)) {
      return []
    }

    if (
      javascriptSyntaxNodeNames(
        'JSXStartTag',
        'JSXEndTag',
        'JSXStartCloseTag',
        'JSXSelfCloseEndTag',
      )
        .get()
        .includes(startNode.name)
    ) {
      if (
        startNode.matchContext([JAVA_SCRIPT_SYNTAXNODE_NAME.JSXFragmentTag]) ||
        (javascriptSyntaxNodeNames('JSXStartCloseTag', 'JSXEndTag')
          .get()
          .includes(startNode.name) &&
          !startNode.parent?.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXMemberExpression) &&
          !startNode.parent?.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXBuiltin))
      ) {
        // fragment

        const jsxElement = startNode.parent!.parent!

        const firstChild = jsxElement.firstChild
        const lastChild = jsxElement.lastChild

        if (!firstChild || !lastChild) return []
        if (
          firstChild.name !== JAVA_SCRIPT_SYNTAXNODE_NAME.JSXFragmentTag ||
          lastChild.name !== JAVA_SCRIPT_SYNTAXNODE_NAME.JSXCloseTag ||
          state.doc.sliceString(lastChild.from, lastChild.to) !== '</>'
        )
          return []

        return [
          matchingBracketMark.range(firstChild.from, firstChild.to),
          matchingBracketMark.range(lastChild.from, lastChild.to),
        ]
      }

      if (startNode.parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXSelfClosingTag) {
        const direction = startNode.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXStartTag ? 'ltr' : 'rtl'

        const jsxSelfClosingTagOpen = direction === 'ltr' ? startNode : endNode
        const jsxSelfClosingTagEnd = direction === 'ltr' ? endNode : startNode

        const jsxAttribute =
          startNode.parent.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXAttribute) ??
          startNode.parent.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXSpreadAttribute)

        if (!jsxAttribute) {
          return [matchingBracketMark.range(jsxSelfClosingTagOpen.from, jsxSelfClosingTagEnd.to)]
        }

        return [
          matchingBracketMark.range(jsxSelfClosingTagOpen.from, jsxAttribute.from - 1),
          matchingBracketMark.range(jsxSelfClosingTagEnd.from, jsxSelfClosingTagEnd.to),
        ]
      }

      const jsxElement = startNode.parent?.parent

      const jsxElementOpen = jsxElement?.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXOpenTag)
      const jsxElementClose = jsxElement?.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXCloseTag)

      if (!jsxElementOpen || !jsxElementClose) return []

      const jsxElementOpenIdentifier =
        jsxElementOpen.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXBuiltin) ??
        jsxElementOpen.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXMemberExpression)

      if (jsxElementOpenIdentifier?.nextSibling?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXEndTag) {
        return [
          matchingBracketMark.range(jsxElementOpen.from, jsxElementOpen.to),
          matchingBracketMark.range(jsxElementClose.from, jsxElementClose.to),
        ]
      }

      const jsxElementOpenEndTag = jsxElementOpen.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME.JSXEndTag)

      return [
        matchingBracketMark.range(jsxElementOpen.from, jsxElementOpenIdentifier!.to),
        matchingBracketMark.range(jsxElementOpenEndTag!.from, jsxElementOpenEndTag!.to),
        matchingBracketMark.range(jsxElementClose.from, jsxElementClose.to),
      ]
    }

    const hasNoContent = startNode.to === endNode.from || endNode.to === startNode.from

    if (hasNoContent) {
      const direction = startNode.to === endNode.from ? 'ltr' : 'rtl'

      return direction === 'ltr'
        ? [matchingBracketMark.range(match.start.from, match.end!.to)]
        : [matchingBracketMark.range(match.end!.from, match.start.to)]
    }

    return [
      matchingBracketMark.range(match.start.from, match.start.to),
      matchingBracketMark.range(match.end!.from, match.end!.to),
    ]
  }

  // not matched

  const startNode = tree.resolve(match.start.from, 1)

  if (startNode.name === JAVA_SCRIPT_SYNTAXNODE_NAME['{']) {
    const parent = startNode.parent

    if (parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXEscape) {
      // jsxEscape: start

      return [
        matchingBracketMark.range(parent.from, parent.from + 1),
        matchingBracketMark.range(parent.to, parent.to + 1),
      ]
    }

    return []
  }

  if (startNode.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXText) {
    const prevSibling = startNode.prevSibling

    if (prevSibling?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.JSXEscape) {
      // jsxEscape: end

      return [
        matchingBracketMark.range(prevSibling.from, prevSibling.from + 1),
        matchingBracketMark.range(prevSibling.to, prevSibling.to + 1),
      ]
    }

    return []
  }

  if (startNode.name === '>') {
    if (startNode.parent?.name === JAVA_SCRIPT_SYNTAXNODE_NAME.TypeParamList) {
      return [
        matchingBracketMark.range(startNode.parent.from, startNode.parent.from + 1),
        matchingBracketMark.range(startNode.from, startNode.to),
      ]
    }

    return []
  }

  if (startNode.name === JAVA_SCRIPT_SYNTAXNODE_NAME.TypeParamList) {
    const closeAngleBracket = startNode.getChild(JAVA_SCRIPT_SYNTAXNODE_NAME['>'])

    if (closeAngleBracket) {
      return [
        matchingBracketMark.range(startNode.from, startNode.from + 1),
        matchingBracketMark.range(closeAngleBracket.from, closeAngleBracket.to),
      ]
    }

    return []
  }

  return []
}
