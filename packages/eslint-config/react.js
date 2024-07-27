/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve('./rules/react-hooks'), require.resolve('./_base')],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    browser: true,
  },
  overrides: [{ files: ['*.js?(x)', '*.ts?(x)'] }],
}
