type CamelToKebabImproved<
  S extends string,
  PrevChar extends string = '',
  Result extends string = '',
> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? PrevChar extends ''
      ? // First character is uppercase
        CamelToKebabImproved<Rest, First, `${Result}${Lowercase<First>}`>
      : PrevChar extends Uppercase<PrevChar>
        ? // Previous character was also uppercase (consecutive uppercase)
          Rest extends `${infer NextChar}${infer NextRest}`
          ? NextChar extends Uppercase<NextChar>
            ? // Next character is also uppercase (continuing sequence)
              CamelToKebabImproved<Rest, First, `${Result}${Lowercase<First>}`>
            : // End of consecutive uppercase, followed by lowercase
              CamelToKebabImproved<Rest, First, `${Result}${Lowercase<First>}`>
          : // End of string
            `${Result}${Lowercase<First>}`
        : // Previous character was lowercase (new word)
          CamelToKebabImproved<Rest, First, `${Result}-${Lowercase<First>}`>
    : // Current character is lowercase
      CamelToKebabImproved<Rest, First, `${Result}${First}`>
  : // End of string
    Result

type RemoveDuplicateHyphens<
  S extends string,
  Result extends string = '',
> = S extends `${infer First}${infer Rest}`
  ? First extends '-'
    ? Rest extends `${'-'}${infer NextRest}`
      ? // 연속된 하이픈 발견 - 첫 번째만 유지하고 다음은 건너뜀
        RemoveDuplicateHyphens<NextRest, `${Result}${First}`>
      : // 단일 하이픈
        RemoveDuplicateHyphens<Rest, `${Result}${First}`>
    : // 하이픈이 아닌 문자
      RemoveDuplicateHyphens<Rest, `${Result}${First}`>
  : // 문자열 끝
    Result

export type CamelCaseToKebabCase<S extends string> = RemoveDuplicateHyphens<CamelToKebabImproved<S>>

export type FlattenKeys<T, Separator extends string = '.'> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends Array<any> // 배열인 경우, 내부 요소 무시하고 키만 유지
            ? `${K}`
            : T[K] extends Record<string, any>
              ? `${K}${Separator}${FlattenKeys<T[K], Separator>}`
              : `${K}`
          : never
      }[keyof T]
    : never

export type GetNestedKebabValue<T, Path extends string> = Path extends `${infer L}-${infer R}`
  ? L extends keyof T
    ? T[L] extends Record<string, any>
      ? GetNestedKebabValue<T[L], R>
      : never
    : `${L}${Capitalize<R>}` extends keyof T
      ? T[`${L}${Capitalize<R>}`]
      : R extends `${infer RL}-${infer RR}`
        ? `${L}${Capitalize<RL>}` extends keyof T
          ? GetNestedKebabValue<T[`${L}${Capitalize<RL>}`], RR>
          : never
        : never
  : Path extends keyof T
    ? T[Path]
    : never

export type DeepRequired<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepRequired<U>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepRequired<U>>
      : T extends object
        ? { [K in keyof T]-?: DeepRequired<T[K]> }
        : T

export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T
