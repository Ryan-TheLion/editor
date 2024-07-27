/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['plugin:react-hooks/recommended'],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
  },
}
