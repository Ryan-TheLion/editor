/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@org/eslint-config/node.js'],
  env: {
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
}
