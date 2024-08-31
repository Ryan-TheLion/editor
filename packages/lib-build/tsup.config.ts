import { defineTsupConfig } from '@org/tsup-config'

export default defineTsupConfig({
  overrideConfig() {
    return {
      entry: ['src/cli.ts'],
      minify: true,
      treeshake: true,
      format: ['cjs'],
      outDir: 'bin',
      dts: false,
      banner(ctx) {
        return {
          js: `#!/usr/bin/env node`,
        }
      },
    }
  },
})
