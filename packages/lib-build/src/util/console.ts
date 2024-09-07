import chalk from 'chalk'

export const prettierToMultiLineString = (strings: string) => {
  return strings
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
}

export const consoleSourceToDest = ({ source, dest }: { source: string; dest: string }) => {
  console.log(chalk.bold.cyanBright(source), chalk.bold('->'), chalk.bold.cyanBright(dest))
}
