import { Line, Text } from '@codemirror/state'

export const docLines = (doc: Text) => {
  const lines: Line[] = []

  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber++) {
    lines.push(doc.line(lineNumber))
  }

  return lines
}
