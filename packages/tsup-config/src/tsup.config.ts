import { Options } from 'tsup'

export default {
  entry: ['src/index.ts'],
  minify: true,
  dts: true,
  clean: true,
  format: ['cjs', 'esm'],
  external: ['tsup'],
} as Options
