import { language } from '@codemirror/language'
import { Command, keymap } from '@codemirror/view'
import prettierConfig from '@org/prettier-config'
import { Config } from 'prettier'
import { formatWithCursor } from 'prettier/standalone'

import { createPrettierPlugins, getEditorLanguage, getPrettierParser } from './util'

export const prettierCommand: Command = (view) => {
  const sourceCode = view.state.doc.toString()

  // eslint-disable-next-line no-unused-vars
  const { $schema, ...config } = prettierConfig

  const editorLanguage = getEditorLanguage(view.state.facet(language.reader))
  if (!editorLanguage) return true

  const prettieredCode = formatWithCursor(sourceCode, {
    ...(config as Config),
    cursorOffset: view.state.selection.main.head,
    parser: getPrettierParser(editorLanguage),
    plugins: createPrettierPlugins(editorLanguage),
  })

  prettieredCode
    .then((code) => {
      if (code.formatted === view.state.doc.toString()) return

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: code.formatted,
        },
        ...(code.cursorOffset > -1 && {
          selection: {
            anchor: code.cursorOffset,
            head: code.cursorOffset,
          },
        }),
      })
    })
    .catch(console.error)
    .finally(() => view.focus())

  return true
}

export const prettierKeymap = keymap.of([
  {
    key: 'Mod-s',
    run: prettierCommand,
  },
])
