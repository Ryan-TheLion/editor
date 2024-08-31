import chalk from 'chalk'
import { Argument, Command } from 'commander'
import fsExtra from 'fs-extra'
import { resolve } from 'path'

import { ALLOWED_TARGET_LIB, PACKAGES_DIR } from '../constants'
import { AllowedTargetCategories, AllowedTargetLibs, BuildPkgJSONCli } from '../type/cli'
import { PartialPkgJSONType, PkgJSONType } from '../type/pkg-type'
import { prettierToMultiLineString } from '../util/console'

const packageJSONpath = {
  from: {
    ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'core', 'package.json'),
    ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'react', 'package.json'),
  },
  to: {
    ['editor:core']: resolve(PACKAGES_DIR, 'code-editor', 'lib', 'core', 'package.json'),
    ['editor:react']: resolve(PACKAGES_DIR, 'code-editor', 'lib', 'react', 'package.json'),
  },
}

const program = new Command()

export default program
  .command('build:pkg-json')
  .description(
    prettierToMultiLineString(`
      해당 lib의 배포용 package.json을 deploy 폴더(lib 폴더)에 생성합니다.
    `),
  )
  .addArgument(
    new Argument('[LIB...]', 'target lib').choices(ALLOWED_TARGET_LIB).default(ALLOWED_TARGET_LIB),
  )
  .showHelpAfterError(true)
  .action(async (libs: BuildPkgJSONCli['args']) => {
    await Promise.all(libs!.map((lib) => writePkgJSON(lib)))
  })

async function writePkgJSON(lib: AllowedTargetLibs) {
  let pkg
  let pkgJSON

  switch (lib) {
    case 'editor:core':
      pkg = await getPkgJSON('editor:core')

      pkgJSON = mergePkgJSON(pkg, {
        unregisterFields: ['scripts', 'publishConfig'],
        overrides: {
          main: 'index.cjs',
          module: 'index.js',
          types: 'index.d.ts',
          exports: {
            '.': {
              import: './index.js',
              require: './index.cjs',
              types: './index.d.ts',
            },
            './*': {
              import: './*/index.js',
              require: './*/index.cjs',
              types: './*/index.d.ts',
            },
            './package.json': './package.json',
          },
        },
        callback(pkg) {
          delete pkg.devDependencies['@org/tsup-config']
          delete pkg.devDependencies['tsup']
        },
      })

      break
    case 'editor:react':
      pkg = await getPkgJSON('editor:react')

      pkgJSON = mergePkgJSON(pkg, {
        unregisterFields: ['scripts', 'publishConfig'],
        overrides: {
          main: 'index.cjs',
          module: 'index.js',
          types: 'index.d.ts',
          exports: {
            '.': {
              import: './index.js',
              require: './index.cjs',
              types: './index.d.ts',
            },
            './*': {
              import: './*/index.js',
              require: './*/index.cjs',
              types: './*/index.d.ts',
            },
            './package.json': './package.json',
          },
        },
        callback(pkg) {
          delete pkg.devDependencies['@org/tsup-config']
          delete pkg.devDependencies['tsup']
        },
      })

      break
  }

  const outputJSONpath = packageJSONpath.to[lib]

  console.log(
    chalk.bold.blueBright(`[create package.json]`),
    chalk.magentaBright(lib),
    chalk.bold.cyanBright(outputJSONpath),
  )

  fsExtra.outputJSONSync(outputJSONpath, pkgJSON, { spaces: 2 })
}

// util (helper)

function mergePkgJSON<
  PkgJSON extends object,
  UnregisterFields extends (keyof PkgJSON)[],
  Override extends PartialPkgJSONType<PkgJSON>,
>(
  pkgJSON: PkgJSON,
  {
    overrides,
    unregisterFields,
    callback,
  }: {
    overrides?: Override
    unregisterFields?: UnregisterFields
    callback?: (pkg: PkgJSONType<Omit<PkgJSON, UnregisterFields[number]>, Override>) => void
  } = {},
): PkgJSONType<Omit<PkgJSON, UnregisterFields[number]>, Override> {
  const filteredPkgJSON = Object.fromEntries(
    Object.entries(pkgJSON).filter(([key]) => !unregisterFields?.includes(key as any)),
  )

  const {
    name,
    private: privateField,
    version,
    sideEffects,
    type,
    main,
    module: moduleField,
    types,
    ...pkgJSONFields
  } = {
    ...filteredPkgJSON,
    ...overrides,
  } as any

  const mergedPkgJSON = {
    ...(name && { name }),
    ...(typeof privateField !== 'undefined' && { ['private']: privateField }),
    ...(version && { version }),
    ...(typeof sideEffects !== 'undefined' && { sideEffects }),
    ...(type && { type }),
    ...(main && { main }),
    ...(moduleField && { ['module']: moduleField }),
    ...(types && { types }),
    ...pkgJSONFields,
  } as any

  if (callback) {
    callback(mergedPkgJSON)
  }

  return mergedPkgJSON
}

async function getPkgJSON<Lib extends AllowedTargetLibs | AllowedTargetCategories>(lib: Lib) {
  const pkg = {
    editor: await import('../../../code-editor/package.json', {
      assert: { type: 'json' },
    }).then((mod) => mod.default),
    ['editor:core']: await import('../../../code-editor/core/package.json', {
      assert: { type: 'json' },
    }).then((mod) => mod.default),
    ['editor:react']: await import('../../../code-editor/react/package.json', {
      assert: { type: 'json' },
    }).then((mod) => mod.default),
  } as const

  return pkg[lib] as (typeof pkg)[Lib]
}
