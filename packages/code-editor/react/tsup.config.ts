import { defineTsupConfig } from '@org/tsup-config'

export default defineTsupConfig({
  overrideConfig({ watch, env }) {
    const isDev = env?.NODE_ENV === 'development' || watch

    return {
      entry: ['src/index.ts'],
      minify: !isDev,
      treeshake: true,
    }
  },
})
