import { language } from '@codemirror/language'
import { Command, keymap } from '@codemirror/view'
import { Config } from 'prettier'
import * as prettier from 'prettier/standalone'

import { createPrettierPlugins, getEditorLanguage, getPrettierParser } from './util'

const prettierConfig: Config = {
  printWidth: 100,
  trailingComma: 'all',
  useTabs: false,
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: 'always',
}

export const prettierCommand: Command = (view) => {
  const sourceCode = view.state.doc.toString()

  const editorLanguage = getEditorLanguage(view.state.facet(language.reader))
  if (!editorLanguage) return true

  const prettieredCode = prettier.formatWithCursor(sourceCode, {
    ...(prettierConfig as Config),
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
