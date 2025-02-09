import { CreateArrayWithLength } from './common'

export type PositiveInteger<Int extends number> = `${Int}` extends
  | `-${number}`
  | `${number}.${number}`
  ? never
  : Int

export type StringToNumber<T extends string> = T extends `${infer N extends number}` ? N : never

/**
 * 1만큼 증가시키는 타입 (+1)
 * @example
 * ```ts
 * Increment<20> // 21
 * ```
 */
export type Increment<N extends number> = [
  ...CreateArrayWithLength<N>,
  any,
]['length'] extends infer Num extends number
  ? Num
  : never

/**
 * 1만큼 감소시키는 타입 (-1)
 * @example
 * ```ts
 * Decrement<21> // 20
 * ```
 */
export type Decrement<N extends number> = `${N}` extends `0`
  ? -1
  : `${N}` extends `-${infer M extends number}`
    ? Increment<M> extends infer Num extends number
      ? StringToNumber<`-${Num}`>
      : CreateArrayWithLength<N> extends [infer N, ...infer Rest]
        ? [...Rest]['length']
        : never
    : never

/**
 * 0 부터 N 까지의 유니온 타입
 * @example
 * ```ts
 * RangeZeorTo<255> // 0 | 1 | 2 | ... | 255
 * ```
 */
export type RangeZeroToN<N extends number, Acc extends number[] = []> =
  Acc['length'] extends Increment<N> ? Acc[number] : RangeZeroToN<N, [...Acc, Acc['length']]>
