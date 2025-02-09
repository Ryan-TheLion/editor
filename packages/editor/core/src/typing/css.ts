import { OR, RangeZeroToN, StringLength, StringToCharsArray } from './util'

export type CSSAspectRatio = `${number} / ${number}`

/**
 * 사이즈 css unit 타입
 */
export type CSSSizeUnit = SizeUnit | PercentSizeUnit

export type SizeUnit = 'px' | 'em' | 'rem'
export type PercentSizeUnit = '%'

/**
 * 양수 size
 *
 * ``` ts
 * PositiveSize<1> // '1px' | '1em' | '1rem' | '1%'
 * PositiveSize<1, SizeUnit> // '1px' | '1em' | '1rem'
 * PositiveSize<1, 'px'> // '1px'
 * PositiveSize<'1px'> // '1px'
 *
 * PositiveSize<-1> // never
 * PositiveSize<-1, 'px'> //never
 * PositiveSize<'1'> // never
 * ```
 */
export type PositiveSize<
  Size extends number | string,
  Unit extends CSSSizeUnit = CSSSizeUnit,
> = Size extends number
  ? `${Size}` extends `-${number}` | `+${number}`
    ? never
    : `${Size}${Unit}`
  : Size extends `-${number}` | `+${number}` | `${number}` | `-${number}${Unit}`
    ? never
    : Size extends `${number}${Unit}`
      ? Size
      : never

/* ---- color ---- */

// ---- named color ----

type CssNamedColor =
  | 'aliceblue'
  | 'antiquewhite'
  | 'aqua'
  | 'aquamarine'
  | 'azure'
  | 'beige'
  | 'bisque'
  | 'black'
  | 'blanchedalmond'
  | 'blue'
  | 'blueviolet'
  | 'brown'
  | 'burlywood'
  | 'cadetblue'
  | 'chartreuse'
  | 'chocolate'
  | 'coral'
  | 'cornflowerblue'
  | 'cornsilk'
  | 'crimson'
  | 'cyan'
  | 'darkblue'
  | 'darkcyan'
  | 'darkgoldenrod'
  | 'darkgray'
  | 'darkgreen'
  | 'darkgrey'
  | 'darkkhaki'
  | 'darkmagenta'
  | 'darkolivegreen'
  | 'darkorange'
  | 'darkorchid'
  | 'darkred'
  | 'darksalmon'
  | 'darkseagreen'
  | 'darkslateblue'
  | 'darkslategray'
  | 'darkslategrey'
  | 'darkturquoise'
  | 'darkviolet'
  | 'deeppink'
  | 'deepskyblue'
  | 'dimgray'
  | 'dimgrey'
  | 'dodgerblue'
  | 'firebrick'
  | 'floralwhite'
  | 'forestgreen'
  | 'fuchsia'
  | 'gainsboro'
  | 'ghostwhite'
  | 'gold'
  | 'goldenrod'
  | 'gray'
  | 'green'
  | 'greenyellow'
  | 'grey'
  | 'honeydew'
  | 'hotpink'
  | 'indianred'
  | 'indigo'
  | 'ivory'
  | 'khaki'
  | 'lavender'
  | 'lavenderblush'
  | 'lawngreen'
  | 'lemonchiffon'
  | 'lightblue'
  | 'lightcoral'
  | 'lightcyan'
  | 'lightgoldenrodyellow'
  | 'lightgray'
  | 'lightgreen'
  | 'lightgrey'
  | 'lightpink'
  | 'lightsalmon'
  | 'lightseagreen'
  | 'lightskyblue'
  | 'lightslategray'
  | 'lightslategrey'
  | 'lightsteelblue'
  | 'lightyellow'
  | 'lime'
  | 'limegreen'
  | 'linen'
  | 'magenta'
  | 'maroon'
  | 'mediumaquamarine'
  | 'mediumblue'
  | 'mediumorchid'
  | 'mediumpurple'
  | 'mediumseagreen'
  | 'mediumslateblue'
  | 'mediumspringgreen'
  | 'mediumturquoise'
  | 'mediumvioletred'
  | 'midnightblue'
  | 'mintcream'
  | 'mistyrose'
  | 'moccasin'
  | 'navajowhite'
  | 'navy'
  | 'oldlace'
  | 'olive'
  | 'olivedrab'
  | 'orange'
  | 'orangered'
  | 'orchid'
  | 'palegoldenrod'
  | 'palegreen'
  | 'paleturquoise'
  | 'palevioletred'
  | 'papayawhip'
  | 'peachpuff'
  | 'peru'
  | 'pink'
  | 'plum'
  | 'powderblue'
  | 'purple'
  | 'rebeccapurple'
  | 'red'
  | 'rosybrown'
  | 'royalblue'
  | 'saddlebrown'
  | 'salmon'
  | 'sandybrown'
  | 'seagreen'
  | 'seashell'
  | 'sienna'
  | 'silver'
  | 'skyblue'
  | 'slateblue'
  | 'slategray'
  | 'slategrey'
  | 'snow'
  | 'springgreen'
  | 'steelblue'
  | 'tan'
  | 'teal'
  | 'thistle'
  | 'tomato'
  | 'transparent'
  | 'turquoise'
  | 'violet'
  | 'wheat'
  | 'white'
  | 'whitesmoke'
  | 'yellow'
  | 'yellowgreen'

// ---- hex color ----

type HexDigit =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'

/**
 * hex color 에서 alpha 를 표현하는 두자리의 16진수
 *
 * `'00'` ~ `'ff'`
 */
export type AlphaHex = `${HexDigit}${HexDigit}`

type HexShorthand<Hex extends string> =
  Hex extends `#${infer First extends HexDigit}${infer Two extends HexDigit}${infer Three extends HexDigit}`
    ? Extract<First, Two> extends First
      ? Extract<First, Three> extends never
        ? never
        : Hex
      : never
    : never

type HexFullType<Hex extends string> =
  StringLength<Hex> extends 7
    ? StringToCharsArray<Hex> extends Array<infer D>
      ? Exclude<D, HexDigit> extends '#'
        ? Hex
        : never
      : never
    : never

type HexFullTypeWithAlpha<Hex extends string> =
  StringLength<Hex> extends 9
    ? StringToCharsArray<Hex> extends Array<infer D>
      ? Exclude<D, HexDigit> extends '#'
        ? Hex
        : never
      : never
    : never

export type HexColor<Hex extends string> =
  HexShorthand<Hex> extends never
    ? HexFullType<Hex> extends never
      ? HexFullTypeWithAlpha<Hex> extends never
        ? never
        : Hex
      : Hex
    : Hex

// ---- rgb, rgba ----

type RGBDigit = RangeZeroToN<255>

type AlphaFormat<Format extends number | string> = Format extends number
  ? `${Format}` extends '0' | '1'
    ? Format
    : `${Format}` extends `0.${number}`
      ? Format
      : never
  : Format extends string
    ? `${Format}` extends `.${infer N extends number | string}`
      ? // eslint-disable-next-line no-unused-vars
        `${N}` extends `-${number}` | `-${string}` | `${infer A}.${infer B}`
        ? never
        : `${N}` extends `${number}`
          ? Format
          : never
      : `${Format}` extends `0.${infer N extends number}`
        ? `${N}` extends `-${number}` | `${number}.${number}`
          ? never
          : Format
        : never
    : never

/**
 * rgb format 문자열
 * @example
 * ```ts
 * RGBFormat<'rgb(0, 1, 2)'> // 'rgb(0, 1, 2)'
 * RGBFormat<'rgb(0,1,2)'> // never
 * RGBFormat<'rgb(300, 2, 1)'> // never
 * ```
 */
export type RGBFormat<Format extends string> =
  Format extends `rgb(${infer R extends number}, ${infer G extends number}, ${infer B extends number})`
    ? R extends RGBDigit
      ? G extends RGBDigit
        ? B extends RGBDigit
          ? Format
          : never
        : never
      : never
    : never

/**
 * `rgb(0~255, 0~255, 0~255)` 리터럴 타입
 * @example
 * ```ts
 * RGB<0, 1, 2> // 'rgb(0, 1, 2)'
 * RGB<0, 1, 300> // never
 * ```
 *
 */
export type RGB<R extends RGBDigit, G extends RGBDigit, B extends RGBDigit> = R extends RGBDigit
  ? G extends RGBDigit
    ? B extends RGBDigit
      ? `rgb(${R}, ${G}, ${B})`
      : never
    : never
  : never

/**
 * rgba format 문자열
 * @example
 * ```ts
 * RGBAFormat<'rgba(0, 0, 0, .5)'> // 'rgba(0, 0, 0, .5)'
 * RGBAFormat<'rgba(0, 0, 0, 0.5)'> // 'rgba(0, 0, 0, 0.5)'
 * RGBAFormat<'rgba(0, 0, 0, 1.5)'> // never
 * RGBAFormat<'rgba(0, 0, 0, -1)'> // never
 * ```
 */
export type RGBAFormat<Format extends string> =
  Format extends `rgba(${infer R extends number}, ${infer G extends number}, ${infer B extends number}, ${infer A extends number | string})`
    ? R extends RGBDigit
      ? G extends RGBDigit
        ? B extends RGBDigit
          ? A extends AlphaFormat<A>
            ? Format
            : never
          : never
        : never
      : never
    : never

/**
 * `rgba(0~255, 0~255, 0~255, 0~1)` 리터럴 타입
 * @example
 * ```ts
 * RGBA<0, 0, 0, '.5'> // 'rgba(0, 0, 0, .5)'
 * RGBA<0, 0, 0, 0.5> // 'rgba(0, 0, 0, 0.5)'
 * RGBA<0, 0, 0, 1.5> // never
 * ```
 *
 */
export type RGBA<
  R extends RGBDigit,
  G extends RGBDigit,
  B extends RGBDigit,
  A extends number | string,
> = R extends RGBDigit
  ? G extends RGBDigit
    ? B extends RGBDigit
      ? AlphaFormat<A> extends never
        ? never
        : `rgba(${R}, ${G}, ${B}, ${A})`
      : never
    : never
  : never

// ---- export css color type(named, hex, rgb, rgba) ----

/**
 * css color type (string)
 * - named color
 * @example
 * ```
 * blue
 * ```
 * - hex color
 * @example
 * ```
 * // (shorthand)
 * #eee
 *
 * // (full)
 * #FF00FF
 *
 * // (with alpha)
 * #11111180
 * ```
 * - rgb, rgba
 * @example
 * ```
 * rgb(0, 0, 0)
 * rgba(0, 0, 0, .5)
 * ```
 */
export type CssColor<Color extends string> = OR<
  Color,
  CssNamedColor | HexColor<Color> | RGBFormat<Color> | RGBAFormat<Color>
>
