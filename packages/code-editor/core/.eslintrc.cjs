/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@org/eslint-config/node.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
}
