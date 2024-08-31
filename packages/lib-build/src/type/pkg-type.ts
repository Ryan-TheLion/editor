export type PkgJSONType<Type, Extra = Record<any, any>> = {
  [key in keyof Type]: any
} & Extra

export type PartialPkgJSONType<Type, Extra = Record<any, any>> = Partial<PkgJSONType<Type, Extra>>
