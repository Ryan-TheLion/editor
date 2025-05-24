import { defineTsupConfig } from '@org/tsup-config'
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'

export default defineTsupConfig({
  overrideConfig({ watch, env }) {
    const isDev = env?.NODE_ENV === 'development' || watch

    return {
      entry: ['src/index.ts', 'src/utils/index.ts', 'src/cm/index.ts'],
      minify: !isDev,
      treeshake: true,
      external: ['prettier'],
      esbuildPlugins: [nodeModulesPolyfillPlugin({ modules: ['events'] })],
    }
  },
})
