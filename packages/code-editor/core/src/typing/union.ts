export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer R,
) => void
  ? R
  : never

export type LastInUnion<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer L ? L : never

export type UnionToTuple<U, T extends any[] = []> = [U] extends [never]
  ? T
  : UnionToTuple<Exclude<U, LastInUnion<U>>, [LastInUnion<U>, ...T]>

export type JoinUnion<T extends any[], Sep extends string = ''> = T extends []
  ? ''
  : T extends [infer F]
    ? F extends string
      ? F
      : never
    : T extends [infer F, ...infer R]
      ? F extends string
        ? R extends string[]
          ? `${F}${Sep}${JoinUnion<R, Sep>}`
          : never
        : never
      : never
