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
  rules: {
    // 클래스 메소드 오버로딩 구현
    'no-dupe-class-members': 'off',
    // 함수 오버로딩 구현
    'no-redeclare': 'off',
    // 함수 매개변수 no unused vars off
    'no-unused-vars': ['error', { args: 'none' }],
  },
}
