import { Line } from '@codemirror/state'
import { CursorOptions, Options } from 'prettier'
import * as prettierBabelPlugin from 'prettier/plugins/babel.js'
import prettierEsTreePlugin from 'prettier/plugins/estree.js'
import * as prettierTypeScriptPlugin from 'prettier/plugins/typescript.js'

import { CodeMirrorEditorSupportedLanguage } from '../../languages'

export const getPrettierParser = (
  language: CodeMirrorEditorSupportedLanguage | null,
): CursorOptions['parser'] => {
  if (!language) return

  if (language === 'javascript' || language === 'jsx') return 'babel'
  if (language === 'typescript' || language === 'tsx') return 'typescript'

  return
}

export const createPrettierPlugins = (
  language: CodeMirrorEditorSupportedLanguage,
): Options['plugins'] => {
  if (language === 'javascript' || language === 'jsx')
    return [prettierEsTreePlugin, prettierBabelPlugin]
  if (language === 'typescript' || language === 'tsx')
    return [prettierEsTreePlugin, prettierTypeScriptPlugin]

  return
}

/**
 *
 * 이전 라인 번호를 key, 이전 라인이 포멧팅된 라인들의 배열을 값으로 가지는 Map을 반환
 *
 * @example
 * ```ts
 * // as-is
 * 1 import { Extension } from '@codemirror/state'
 * 2 import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view'
 * 3
 * 4 import { CodeEditor } from '../../code-mirror'
 * 5 import { EventManager } from '../../event-manager'
 *
 * // to-be
 * 1  import { Extension } from '@codemirror/state';
 * 2  import {
 * 3    EditorView,
 * 4    PluginValue,
 * 5    ViewPlugin,
 * 6    ViewUpdate,
 * 7  } from '@codemirror/view';
 * 8
 * 9  import { CodeEditor } from '../../code-mirror';
 * 10 import { EventManager } from '../../event-manager';
 *
 * changesMap : Map(5)
 *
 * {
 *   1: [{ from: 0, to: 46, number: 1, text: "import { Extension } from '@codemirror/state';" }],
 *   2: [
 *    { from: 47, to: 55, number: 2, text: 'import {' },
 *    { from: 56, to: 69, number: 3, text: '  EditorView,' }
 *    { from: 70, to: 84, number: 4, text: '  PluginValue,' }
 *    { from: 85, to: 98, number: 5, text: '  ViewPlugin,' }
 *    { from: 99, to: 112, number: 6, text: '  ViewUpdate,' }
 *    { from: 113, to: 139, number: 7, text: "} from '@codemirror/view';" }
 *   ],
 *   //...
 * }
 * ```
 */
export function prettierChangesMap({
  lines,
  formattedLines,
}: {
  lines: Line[]
  formattedLines: Line[]
}) {
  const map = new Map<number, Line[]>()

  let lineIndex = 0
  let formattedIndex = 0

  while (lineIndex < lines.length && formattedIndex < formattedLines.length) {
    const line = lines[lineIndex]!
    const formattedLine = formattedLines[formattedIndex]!

    const replacedText = {
      line: replacePrettierChar(line.text),
      formattedLine: replacePrettierChar(formattedLine.text),
    }

    if (line.text.trim() === '' && formattedLine.text.trim() === '') {
      map.set(lineIndex + 1, [formattedLine])

      lineIndex += 1
      formattedIndex += 1

      continue
    }

    if (replacedText.line === replacedText.formattedLine) {
      map.set(lineIndex + 1, [formattedLine])

      lineIndex += 1
      formattedIndex += 1

      continue
    }

    let mergedLines: Line[] = []

    while (formattedIndex < formattedLines.length) {
      const formattedLine = formattedLines[formattedIndex]!

      if (formattedLine.text.trim() === '') {
        break
      }

      if (
        replacedText.line === mergedLines.map((line) => replacePrettierChar(line.text)).join('')
      ) {
        break
      }

      mergedLines.push(formattedLine)

      formattedIndex += 1
    }

    map.set(lineIndex + 1, mergedLines)

    mergedLines = []
    lineIndex += 1
  }

  Array.from(map.entries())
    .filter(([, lines]) => {
      return !lines.length
    })
    .forEach(([lineNumber]) => {
      const replacedLineText = replacePrettierChar(lines[lineNumber - 1]!.text)

      for (let n = lineNumber - 1; n >= 1; n--) {
        const formattedLines = map.get(n)

        if (!formattedLines?.length) continue

        const targetLine = formattedLines.find((formattedLine) =>
          replacePrettierChar(formattedLine.text).includes(replacedLineText),
        )

        if (!targetLine) continue

        map.set(lineNumber, [targetLine])

        break
      }
    })

  return map
}

function replacePrettierChar(text: string) {
  return text.replace(/[,;()]/g, '').replace(/\s/g, '')
}
