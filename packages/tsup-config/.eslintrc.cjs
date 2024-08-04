const { resolve } = require('node:path')

const project = resolve(process.cwd(), 'src', 'tsconfig.json')

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@org/eslint-config/node.js'],
  parser: '@typescript-eslint/parser',
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  parserOptions: {
    project: true,
  },
}
