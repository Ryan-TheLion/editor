import chalk from 'chalk'
import { Argument, Command, Option } from 'commander'
import fsExtra from 'fs-extra'
import { resolve } from 'path'

import { ALLOWED_TARGET_LIB, Filter, PACKAGES_DIR } from '../constants'
import { AllowedTargetLibs, CleanCli, FilterKeys } from '../type/cli'
import { prettierToMultiLineString } from '../util/console'
import { getLibs } from '../util/lib-path'

const cleanTargetPath = {
  dist: {
    ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'core', 'dist'),
    ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'react', 'dist'),
  },
  lib: {
    ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'lib', 'core'),
    ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'lib', 'react'),
  },
}

const program = new Command()

export default program
  .command('clean')
  .description(
    prettierToMultiLineString(`
      해당 lib의 directory(dist, lib)를 지웁니다.
      argument를 입력하지 않을 경우 cwd를 기준으로 타겟 lib이 결정됩니다.
    `),
  )
  .addArgument(
    new Argument('[LIB...]', `target lib list to clean`)
      .choices(ALLOWED_TARGET_LIB)
      .default(getLibs({ args: [], cwd: process.cwd() })),
  )
  .addOption(
    new Option('--filter [FILTER...]', 'target directory to clean')
      .choices(Object.values(Filter))
      .default(Object.values(Filter)),
  )
  .showHelpAfterError(true)
  .action(async (args: CleanCli['args'], { filter: filters }: CleanCli['options']) => {
    await Promise.all(args!.map((lib) => [...filters!.map((filter) => clean(filter, lib))]).flat())
  })

async function clean(filter: FilterKeys, lib: AllowedTargetLibs) {
  const path = cleanTargetPath[filter][lib]

  console.log(
    chalk.bold.blueBright(`[clean]`),
    chalk.magentaBright(lib),
    chalk.green(filter),
    chalk.bold.cyanBright(path),
  )

  fsExtra.remove(path)
}
