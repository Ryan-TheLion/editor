import { defineTsupConfig } from '@org/tsup-config'

export default defineTsupConfig({
  overrideConfig() {
    return {
      entry: ['src/cli.ts'],
      minify: true,
      splitting: false,
      treeshake: false,
      format: ['cjs'],
      outDir: 'bin',
      noExternal: ['chalk'],
      dts: false,
      banner(ctx) {
        return {
          js: `#!/usr/bin/env node`,
        }
      },
    }
  },
})
