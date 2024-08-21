import fsExtra from 'fs-extra'
import { join, resolve } from 'path'

import codeEdtiorPkgJSON from '../package.json' assert { type: 'json' }
import corePkgJSON from './package.json' assert { type: 'json' }

const distPath = resolve('./dist')
const libPath = resolve('../lib')

includeFileInDist()
writePkgJSON()

function includeFileInDist() {
  fsExtra.copySync(distPath, join(libPath, 'core'))
}

function writePkgJSON() {
  // lib pkgJSON
  fsExtra.outputJsonSync(
    join(libPath, 'package.json'),
    mergePkgJSON(codeEdtiorPkgJSON, {
      overrides: {
        exports: {
          './core': {
            import: './core/index.js',
            require: './core/index.cjs',
            types: './core/index.d.ts',
          },
          './core/extension': {
            import: './core/extension/index.js',
            require: './core/extension/index.cjs',
            types: './core/extension/index.d.ts',
          },
          './package.json': './package.json',
        },
        dependencies: {
          ...corePkgJSON.dependencies,
        },
        peerDependencies: {
          ...corePkgJSON.peerDependencies,
        },
        peerDependenciesMeta: {
          ...corePkgJSON.peerDependenciesMeta,
        },
      },
      unregisterFields: ['publishConfig', 'devDependencies'],
    }),
    { spaces: 2 },
  )
}

function mergePkgJSON(pkgJSON, { overrides, unregisterFields, callback } = {}) {
  const mergedPkgJSON = {
    ...Object.entries(pkgJSON).reduce((json, [field, value]) => {
      return {
        ...json,
        ...(!unregisterFields?.includes(field) && { [field]: value }),
      }
    }, {}),
    ...overrides,
  }

  if (callback) {
    callback(mergedPkgJSON)
  }

  return mergedPkgJSON
}
