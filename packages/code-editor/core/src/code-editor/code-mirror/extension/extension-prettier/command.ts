import { Annotation, ChangeSet, EditorSelection, Line, TransactionSpec } from '@codemirror/state'
import { Command, EditorView } from '@codemirror/view'
import { Config, Options } from 'prettier'
import * as prettier from 'prettier/standalone'

import { CodeMirrorEditor } from '../../editor'
import { docLines } from '../../../../utils'
import { createPrettierPlugins, getPrettierParser, prettierChangesMap } from './util'

export interface PrettierChanges {
  changesMap: Map<number, Line[]>
  formattedCode: string
}

export const defaultPrettierConfig: Config = {
  printWidth: 100,
  trailingComma: 'all',
  useTabs: false,
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: 'always',
}

export const prettierChangesAnnotation = Annotation.define<PrettierChanges | null>()

export const formatWithPrettier: (config?: Config) => Command = (config) => (view) => {
  const sourceCode = view.state.doc.toString()

  const hasUserConfig = config && Object.keys(config).length
  const targetConfig = hasUserConfig ? config : defaultPrettierConfig

  const editorLanguage = view.state.facet(CodeMirrorEditor.language.reader)

  if (!editorLanguage) return true

  const scrollTop = view.scrollDOM.scrollTop
  const scrollLeft = view.scrollDOM.scrollLeft

  const options: Options = {
    ...(targetConfig as Config),
    parser: getPrettierParser(editorLanguage),
    plugins: createPrettierPlugins(editorLanguage),
  }

  prettier
    .check(sourceCode, options)
    .then(async (alreadyFormatted) => {
      if (alreadyFormatted) {
        view.dispatch({
          annotations: prettierChangesAnnotation.of(null),
        })

        return
      }

      const formattedCode = await prettier.format(sourceCode, options)

      const changes = ChangeSet.of(
        {
          from: 0,
          to: view.state.doc.length,
          insert: formattedCode,
        },
        view.state.doc.length,
      )

      const transactionSpec: TransactionSpec = {
        changes,
        selection: EditorSelection.create(
          view.state.selection.ranges.map((range) => {
            const from = getPos({ pos: range.from, changes })
            const to = getPos({ pos: range.to, changes })

            return EditorSelection.range(from, to, range.goalColumn, range.bidiLevel ?? undefined)
          }),
        ),
      }

      const tr = view.state.update(transactionSpec)

      const changesMap = prettierChangesMap({
        lines: docLines(tr.startState.doc),
        formattedLines: docLines(tr.state.doc),
      })

      const editable = view.state.facet(EditorView.editable.reader)

      view.dispatch({
        ...tr,
        selection: tr.state.selection,
        scrollIntoView: editable,
        annotations: prettierChangesAnnotation.of({
          changesMap,
          formattedCode,
        }),
      })

      // 편집 모드인 경우 scrollIntoView
      if (editable) return

      // 뷰 모드인 경우 스크롤이 이동하지 않도록 설정(이전과 동일한 스크롤 top, left)
      setTimeout(() => {
        view.scrollDOM.scroll({
          left: scrollLeft,
          top: scrollTop,
        })
      }, 0)
    })
    .catch(console.error)

  return true
}

// util

function getPos({ pos, changes }: { pos: number; changes: ChangeSet }) {
  if (pos > changes.newLength) {
    return pos + (changes.newLength - changes.length)
  }

  return pos
}
