import chalk from 'chalk'
import { Command, Option } from 'commander'
import fsExtra from 'fs-extra'
import { basename, resolve } from 'path'

import { ALLOWED_TARGET_LIB, PACKAGES_DIR } from '../constants'
import { AllowedTargetLibs, CopyCli } from '../type/cli'
import { consoleSourceToDest, prettierToMultiLineString } from '../util/console'

const rootPath = {
  ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'core'),
  ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'react'),
}

const publicFiles = {
  ['editor:core']: [resolve(rootPath['editor:core'], 'README.md')],
  ['editor:react']: [resolve(rootPath['editor:react'], 'README.md')],
}

const copyPath = {
  from: {
    ['editor:core']: resolve(rootPath['editor:core'], 'dist'),
    ['editor:react']: resolve(rootPath['editor:react'], 'dist'),
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
  const source = copyPath.from[lib]
  const dest = copyPath.to[lib]

  console.log(chalk.bold.blueBright(`[copy]`), chalk.magentaBright(lib))

  copyPublicFiles({ lib })

  consoleSourceToDest({ source, dest })
  fsExtra.copySync(source, dest)
}

function copyPublicFiles({ lib }: { lib: AllowedTargetLibs }) {
  const sourcePaths = publicFiles[lib]
  const destPaths = sourcePaths.map((publicFilePath) =>
    createPublicFileDestPath({ lib, publicFilePath }),
  )

  sourcePaths.forEach((source, index) => {
    const dest = destPaths[index]!

    consoleSourceToDest({ source, dest })
    fsExtra.copySync(source, dest)
  })
}

function createPublicFileDestPath({
  lib,
  publicFilePath,
}: {
  lib: AllowedTargetLibs
  publicFilePath: string
}) {
  return resolve(copyPath.to[lib], basename(publicFilePath))
}
