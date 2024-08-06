import { defineTsupConfig } from '@org/tsup-config'

export default defineTsupConfig({
  overrideConfig() {
    return {
      entry: ['src/index.ts'],
    }
  },
})
