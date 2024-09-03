import { ALLOWED_TARGET_LIB, ALLOWED_TARGET_LIB_CATEGORY, Filter } from '../constants'

export type AllowedTargetLibs = (typeof ALLOWED_TARGET_LIB)[number]

export type AllowedTargetCategories = (typeof ALLOWED_TARGET_LIB_CATEGORY)[number]

export type FilterKeys = (typeof Filter)[keyof typeof Filter]

export interface CleanCli {
  args?: AllowedTargetLibs[]
  options: {
    filter?: FilterKeys[]
  }
}

export interface CopyCli {
  options: {
    targetLib?: AllowedTargetLibs[]
  }
}

export interface BuildPkgJSONCli {
  args?: AllowedTargetLibs[]
}
