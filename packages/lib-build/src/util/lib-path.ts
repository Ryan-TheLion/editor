import { resolve } from 'path'

import { ALLOWED_TARGET_LIB, PACKAGES_DIR } from '../constants'
import { AllowedTargetLibs } from '../type/cli'

const path: Record<AllowedTargetLibs, string> = {
  'editor:core': resolve(PACKAGES_DIR, 'code-editor', 'core'),
  'editor:react': resolve(PACKAGES_DIR, 'code-editor', 'react'),
}

export function getLibs({ args, cwd }: { args: string[]; cwd: string }) {
  const libs = getTargetLibFromArgs(args) ?? getTargetLibFromCwd(cwd)

  if (!libs) return null

  return Array.isArray(libs) ? [...libs] : [libs]
}

export const getTargetLibFromArgs = (args: string[]) => {
  const libList = args.filter((arg) =>
    ALLOWED_TARGET_LIB.includes(arg as any),
  ) as AllowedTargetLibs[]

  return libList?.length ? libList : null
}

export const getTargetLibFromCwd = (cwd: string): AllowedTargetLibs | null => {
  const targetEntry = (Object.entries(path) as [AllowedTargetLibs, string][]).find(([, path]) =>
    cwd.includes(path),
  )

  return targetEntry ? targetEntry[0] : null
}
