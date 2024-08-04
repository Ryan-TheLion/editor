import { defineTsupConfig } from '@org/tsup-config'

export default defineTsupConfig({
  overrideConfig: () => ({
    clean: false,
  }),
})
