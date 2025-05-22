export type Nullable<T> = T | null

export type NonPartial<O extends Record<any, any>> = {
  [K in keyof O]-?: Exclude<O[K], undefined>
}

/** Record에서 특정 키의 value 타입 (`Pick`) */
export type ValueOf<T extends Record<any, any>, K extends keyof T> = T[K]

/** Record value 들의 유니온 타입 */
export type Values<T extends Record<any, any>> = T[keyof T]

export type ResolveToPrimitive<Field> = Field extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => any
    ? ResolveToPrimitive<R>
    : R
  : Field

export type UnwrapArray<T> = T extends Array<infer R> ? R : never

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T

/**
 * N 개의 요소를 가지는 배열 타입
 * - 숫자 관련 타입을 만드는데 활용하기 위한 유틸 타입
 * @example
 * ```ts
 * CreateArrayWithLength<4> // [1, 1, 1, 1]
 * ```
 */
export type CreateArrayWithLength<
  LENGTH extends number,
  ACC extends unknown[] = [],
> = ACC['length'] extends LENGTH ? ACC : CreateArrayWithLength<LENGTH, [...ACC, 1]>

export type OR<T, U> = T extends U ? T : never
