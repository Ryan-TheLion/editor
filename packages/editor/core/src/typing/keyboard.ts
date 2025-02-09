import { Values } from './util'

/**
 * Prosemirror keybinding에서 특정 키를 매핑하는 문자열 (ex. `Mod`, `ArrowLeft`)
 *
 * ```ts
 * ArrowLeft: 'ArrowLeft'
 * ArrowRight: 'ArrowRight'
 * ArrowUp: 'ArrowUp'
 * ArrowDown: 'ArrowDown'
 * Enter: 'Enter'
 * Backspace: 'Backspace'
 * Tab: 'Tab'
 * Mod: 'Mod'
 * Meta: 'Meta'
 * Ctrl: 'Ctrl'
 * Alt: 'Alt'
 * Shift: 'Shift'
 * Delete: 'Delete'
 * Escape: 'Escape'
 * Space: 'Space'
 * Home: 'Home'
 * End: 'End'
 * PageUp: 'PageUp'
 * PageDown: 'PageDown'
 * CapsLock: 'CapsLock'
 * ```
 */
export interface ProsemirrorKeys {
  ArrowLeft: 'ArrowLeft'
  ArrowRight: 'ArrowRight'
  ArrowUp: 'ArrowUp'
  ArrowDown: 'ArrowDown'
  Enter: 'Enter'
  Backspace: 'Backspace'
  Tab: 'Tab'
  Mod: 'Mod'
  Meta: 'Meta'
  Ctrl: 'Ctrl'
  Alt: 'Alt'
  Shift: 'Shift'
  Delete: 'Delete'
  Escape: 'Escape'
  Space: 'Space'
  Home: 'Home'
  End: 'End'
  PageUp: 'PageUp'
  PageDown: 'PageDown'
  CapsLock: 'CapsLock'
}

/**
 * 키에 대한 가독성을 높이기 위한 시각적인 심볼
 *
 * ```ts
 * '←': 'ArrowLeft'
 * '→': 'ArrowRight'
 * '↑': 'ArrowUp'
 * '↓': 'ArrowDown'
 * '↩': 'Enter'
 * '⌫': 'Backspace'
 * '⇥': 'Tab'
 * '⌘': 'Mod'
 * '⌃': 'Ctrl'
 * '⌥': 'Alt'
 * '⇧': 'Shift'
 * '␡': 'Delete'
 * ```
 */
export interface ProsemirrorKeySymbols {
  '←': 'ArrowLeft'
  '→': 'ArrowRight'
  '↑': 'ArrowUp'
  '↓': 'ArrowDown'
  '↩': 'Enter'
  '⌫': 'Backspace'
  '⇥': 'Tab'
  '⌘': 'Mod'
  '⌃': 'Ctrl'
  '⌥': 'Alt'
  '⇧': 'Shift'
  '␡': 'Delete'
}

/**
 * 숫자 키
 *
 * ```ts
 * '0': '0'
 * '1': '1'
 * '2': '2'
 * '3': '3'
 * '4': '4'
 * '5': '5'
 * '6': '6'
 * '7': '7'
 * '8': '8'
 * '9': '9'
 * ```
 */
export interface NumberKeys {
  '0': '0'
  '1': '1'
  '2': '2'
  '3': '3'
  '4': '4'
  '5': '5'
  '6': '6'
  '7': '7'
  '8': '8'
  '9': '9'
}

/**
 * 알파벳 키
 *
 * ```ts
 * a: 'a'
 * b: 'b'
 * c: 'c'
 * d: 'd'
 * e: 'e'
 * f: 'f'
 * g: 'g'
 * h: 'h'
 * i: 'i'
 * j: 'j'
 * k: 'k'
 * l: 'l'
 * m: 'm'
 * n: 'n'
 * o: 'o'
 * p: 'p'
 * q: 'q'
 * r: 'r'
 * s: 's'
 * t: 't'
 * u: 'u'
 * v: 'v'
 * w: 'w'
 * x: 'x'
 * y: 'y'
 * z: 'z'
 * A: 'A'
 * B: 'B'
 * C: 'C'
 * D: 'D'
 * E: 'E'
 * F: 'F'
 * G: 'G'
 * H: 'H'
 * I: 'I'
 * J: 'J'
 * K: 'K'
 * L: 'L'
 * M: 'M'
 * N: 'N'
 * O: 'O'
 * P: 'P'
 * Q: 'Q'
 * R: 'R'
 * S: 'S'
 * T: 'T'
 * U: 'U'
 * V: 'V'
 * W: 'W'
 * X: 'X'
 * Y: 'Y'
 * Z: 'Z'
 * ```
 *
 */
export interface AlphaKeys {
  a: 'a'
  b: 'b'
  c: 'c'
  d: 'd'
  e: 'e'
  f: 'f'
  g: 'g'
  h: 'h'
  i: 'i'
  j: 'j'
  k: 'k'
  l: 'l'
  m: 'm'
  n: 'n'
  o: 'o'
  p: 'p'
  q: 'q'
  r: 'r'
  s: 's'
  t: 't'
  u: 'u'
  v: 'v'
  w: 'w'
  x: 'x'
  y: 'y'
  z: 'z'
  A: 'A'
  B: 'B'
  C: 'C'
  D: 'D'
  E: 'E'
  F: 'F'
  G: 'G'
  H: 'H'
  I: 'I'
  J: 'J'
  K: 'K'
  L: 'L'
  M: 'M'
  N: 'N'
  O: 'O'
  P: 'P'
  Q: 'Q'
  R: 'R'
  S: 'S'
  T: 'T'
  U: 'U'
  V: 'V'
  W: 'W'
  X: 'X'
  Y: 'Y'
  Z: 'Z'
}

/**
 * 특수 문자 키
 *
 * ```ts
 * ExclamationMark: '!'
 * DoubleQuote: '"'
 * Hash: '#'
 * Dollar: '$'
 * Percent: '%'
 * Ampersand: '&'
 * Apostrophe: "'"
 * LeftParenthesis: '('
 * RightParenthesis: ')'
 * Asterisk: '*'
 * Plus: '+'
 * Comma: ','
 * Minus: '-'
 * Period: '.'
 * Slash: '/'
 * Colon: ':'
 * Semicolon: ';'
 * LeftAngleBracket: '<'
 * Equals: '='
 * RightAngleBracket: '>'
 * QuestionMark: '?'
 * At: '@'
 * LeftBracket: '['
 * Backslash: '\\'
 * RightBracket: ']'
 * Caret: '^'
 * Underscore: '_'
 * Backtick: '`'
 * LeftBrace: '{'
 * Pipe: '|'
 * RightBrace: '}'
 * Tilde: '~'
 * ```
 */
export interface SpecialKeys {
  ExclamationMark: '!'
  DoubleQuote: '"'
  Hash: '#'
  Dollar: '$'
  Percent: '%'
  Ampersand: '&'
  Apostrophe: "'"
  LeftParenthesis: '('
  RightParenthesis: ')'
  Asterisk: '*'
  Plus: '+'
  Comma: ','
  Minus: '-'
  Period: '.'
  Slash: '/'
  Colon: ':'
  Semicolon: ';'
  LeftAngleBracket: '<'
  Equals: '='
  RightAngleBracket: '>'
  QuestionMark: '?'
  At: '@'
  LeftBracket: '['
  Backslash: '\\'
  RightBracket: ']'
  Caret: '^'
  Underscore: '_'
  Backtick: '`'
  LeftBrace: '{'
  Pipe: '|'
  RightBrace: '}'
  Tilde: '~'
}

/**
 * 함수 키(`F1` ~ `F12`)
 *
 * ```ts
 * F1: 'F1'
 * F2: 'F2'
 * F3: 'F3'
 * F4: 'F4'
 * F5: 'F5'
 * F6: 'F6'
 * F7: 'F7'
 * F8: 'F8'
 * F9: 'F9'
 * F10: 'F10'
 * F11: 'F11'
 * F12: 'F12'
 * ```
 */
export interface FnKeys {
  F1: 'F1'
  F2: 'F2'
  F3: 'F3'
  F4: 'F4'
  F5: 'F5'
  F6: 'F6'
  F7: 'F7'
  F8: 'F8'
  F9: 'F9'
  F10: 'F10'
  F11: 'F11'
  F12: 'F12'
}

export type ProsemirrorKeyboard = AlphaKeys &
  NumberKeys &
  ProsemirrorKeys &
  SpecialKeys &
  FnKeys &
  ProsemirrorKeySymbols

export type CombineProsemirrorKey = Values<ProsemirrorKeyboard> | keyof ProsemirrorKeySymbols

/**
 * `ProsemirrorKeyboard` 타입의 값들을 조합하여 키 조합 문자열 타입을 생성
 *
 * @example
 * ```ts
 * CombineProsemirrorKeys<['Mod', 'b']> // 'Mod-b'
 * CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], ProsemirrorKeyboard['b']]> // 'Mod-b'
 * CombineProsemirrorKeys<[ProsemirrorKeyboard['Mod'], 'b']> // 'Mod-b'
 *
 * CombineProsemirrorKeys<['Enter']> // = ProsemirrorKeyboard['Enter'] = 'Enter'
 *
 * CombineProsemirrorKeys<['mod', '3']> // never
 * ```
 */
export type CombineProsemirrorKeys<T extends CombineProsemirrorKey[] = []> = T extends [
  infer First extends CombineProsemirrorKey,
  ...infer Rest extends CombineProsemirrorKey[],
]
  ? Rest extends []
    ? First extends keyof ProsemirrorKeySymbols
      ? ProsemirrorKeySymbols[`${First}`]
      : First
    : First extends keyof ProsemirrorKeySymbols
      ? `${ProsemirrorKeySymbols[`${First}`]}-${CombineProsemirrorKeys<Rest>}`
      : `${First}-${CombineProsemirrorKeys<Rest>}`
  : never
