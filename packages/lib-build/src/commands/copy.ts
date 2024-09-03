import chalk from 'chalk'
import { Command, Option } from 'commander'
import fsExtra from 'fs-extra'
import { resolve } from 'path'

import { ALLOWED_TARGET_LIB, PACKAGES_DIR } from '../constants'
import { AllowedTargetLibs, CopyCli } from '../type/cli'
import { prettierToMultiLineString } from '../util/console'

const copyPath = {
  from: {
    ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'core', 'dist'),
    ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'react', 'dist'),
  },
  to: {
    ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'lib', 'core'),
    ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'lib', 'react'),
  },
}

const program = new Command()

export default program
  .command('copy')
  .description(
    prettierToMultiLineString(`
      해당 lib의 dist 폴더를 deploy 폴더(lib 폴더)로 복사합니다.
    `),
  )
  .addOption(
    new Option('--target-lib [LIB...]', 'target lib list to copy')
      .choices(ALLOWED_TARGET_LIB)
      .default(ALLOWED_TARGET_LIB),
  )
  .showHelpAfterError(true)
  .action(async ({ targetLib }: CopyCli['options']) => {
    await Promise.all(targetLib!.map((lib) => copyBuildToDeploy(lib)))
  })

async function copyBuildToDeploy(lib: AllowedTargetLibs) {
  const sourcePath = copyPath.from[lib]
  const destPath = copyPath.to[lib]

  console.log(chalk.bold.blueBright(`[copy]`), chalk.magentaBright(lib))
  console.log(chalk.bold.cyanBright(sourcePath), chalk.bold('->'), chalk.bold.cyanBright(destPath))

  fsExtra.copy(sourcePath, destPath)
}
