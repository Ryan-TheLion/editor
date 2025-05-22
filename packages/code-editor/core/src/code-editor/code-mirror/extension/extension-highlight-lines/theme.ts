import { EditorView } from '@codemirror/view'
import { EditorThemeMode } from '../../theme'

type ElementSelectorKey = 'line' | 'highlightedLine' | 'lineGutter'

export const HIGHLIGHT_LINE_CLASS = 'cm-highlight-line'

export const HIGHLIGHT_GUTTER_LINE_CLASS = 'cm-highlight-gutter'

const SELECTOR = {
  line: `.cm-line:not(.${HIGHLIGHT_LINE_CLASS})`,
  highlightedLine: `.cm-line.${HIGHLIGHT_LINE_CLASS}`,
  lineGutter: `.cm-gutters .cm-gutterElement.${HIGHLIGHT_GUTTER_LINE_CLASS}`,
  theme: (theme: 'light' | 'dark' | null) => (theme === null ? `&` : `&${theme}`),
  content: '.cm-content',
}

const DATA_SET = {
  hasLineHighlight: (has: boolean) => `[data-has-line-highlight="${has ? 'true' : 'false'}"]`,
  contentEditable: (editable: boolean) => `[contenteditable="${editable ? 'true' : 'false'}"]`,
}

export const lineHighlightStyleSelector = ({
  type,
  themeMode,
  editable,
}: {
  type: ElementSelectorKey
  themeMode?: EditorThemeMode
  editable?: boolean
}) => {
  const base = `${SELECTOR.theme(themeMode ?? null)}${DATA_SET.hasLineHighlight(true)}`

  const withEditableSelector = (editable: boolean) => {
    return `${base}:has(.cm-content${DATA_SET.contentEditable(editable)})`
  }

  const typeSelector = ((type: ElementSelectorKey) => {
    if (type === 'line') return SELECTOR.line
    if (type === 'highlightedLine') return SELECTOR.highlightedLine

    return SELECTOR.lineGutter
  })(type)

  const parentSelector = typeof editable === 'boolean' ? withEditableSelector(editable) : base

  return `${parentSelector} ${typeSelector}`
}

export const lineHighlightTheme = () => {
  return EditorView.baseTheme({
    // edit mode
    [lineHighlightStyleSelector({ type: 'highlightedLine', themeMode: 'light', editable: true })]: {
      backgroundColor: '#1fd74a26',
    },
    [lineHighlightStyleSelector({ type: 'highlightedLine', themeMode: 'dark', editable: true })]: {
      // backgroundColor: '#5523FA40',
      backgroundColor: '#0e25e761',
    },
    // view mode
    [lineHighlightStyleSelector({ type: 'line', editable: false })]: {
      opacity: 0.4,
    },
    // common
    /// gutter
    [lineHighlightStyleSelector({ type: 'lineGutter' })]: {
      color: '#698FE5',
    },
  })
}
