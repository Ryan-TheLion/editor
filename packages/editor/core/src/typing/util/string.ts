export type TrimStart<S extends string> = S extends ` ${infer R}` ? TrimStart<R> : S

export type TrimEnd<S extends string> = S extends `${infer R} ` ? TrimEnd<R> : S

export type Trim<S extends string> = TrimEnd<TrimStart<S>>

export type SnakeCase<S extends string> = S extends `${infer Front}_${infer End}`
  ? Front extends Lowercase<Front>
    ? End extends Lowercase<End>
      ? S
      : SnakeCase<End>
    : never
  : S extends Lowercase<S>
    ? S
    : never

export type SnakeToPascalCase<S extends string> = S extends `${infer Front}_${infer End}`
  ? `${Capitalize<Front>}${SnakeToPascalCase<Capitalize<End>>}`
  : Capitalize<S>

export type PascalToSnakeCase<S extends string> = S extends `${infer Front}${infer End}`
  ? End extends Uncapitalize<End>
    ? `${Uncapitalize<Front>}${PascalToSnakeCase<End>}`
    : `${Uncapitalize<Front>}_${PascalToSnakeCase<End>}`
  : S extends Capitalize<S>
    ? Uncapitalize<S>
    : S

export type StringToCharsArray<
  T extends string,
  Arr extends string[] = [],
> = T extends `${infer Head}${infer Tail}` ? StringToCharsArray<Tail, [...Arr, Head]> : Arr

export type StringLength<T extends string> = StringToCharsArray<T>['length']
