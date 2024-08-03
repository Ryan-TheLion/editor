const { resolve } = require('node:path')

const project = resolve(process.cwd(), 'tsconfig.json')

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint:recommended',
    'prettier',
    'turbo',
    require.resolve('./rules/import'),
    require.resolve('./rules/naming-convention'),
  ],
  env: {
    es2021: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    '.*.js',
    '.*.cjs',
    '.*.mjs',
    'tsup.config.ts',
    'node_modules/',
    'dist/',
  ],
}
