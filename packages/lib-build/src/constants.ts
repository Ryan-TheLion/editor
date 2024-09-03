import { resolve } from 'path'

export const CLI_NAMESPACE = 'ryan-lib-cli'

export const Filter = {
  Dist: 'dist',
  Lib: 'lib',
} as const

export const PACKAGES_DIR = resolve('../../')

export const ALLOWED_TARGET_LIB = ['editor:core', 'editor:react'] as const

export const ALLOWED_TARGET_LIB_CATEGORY = ['editor'] as const
