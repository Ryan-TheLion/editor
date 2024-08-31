export const prettierToMultiLineString = (strings: string) => {
  return strings
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
}
