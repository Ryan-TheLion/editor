import {
  AlphaKeys,
  CombineProsemirrorKey,
  CombineProsemirrorKeys,
  FnKeys,
  NumberKeys,
  ProsemirrorKeyboard,
  ProsemirrorKeys,
  ProsemirrorKeySymbols,
  SpecialKeys,
} from '../../typing'

const PROSEMIRROR_KEYBOARD_PM_KEYS: ProsemirrorKeys = {
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  Enter: 'Enter',
  Backspace: 'Backspace',
  Tab: 'Tab',
  Mod: 'Mod',
  Meta: 'Meta',
  Ctrl: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Delete: 'Delete',
  Escape: 'Escape',
  Space: 'Space',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  CapsLock: 'CapsLock',
}

const PROSEMIRROR_KEYBOARD_NUMBER: NumberKeys = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
}

const PROSEMIRROR_KEYBOARD_ALPHABET: AlphaKeys = {
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  f: 'f',
  g: 'g',
  h: 'h',
  i: 'i',
  j: 'j',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  o: 'o',
  p: 'p',
  q: 'q',
  r: 'r',
  s: 's',
  t: 't',
  u: 'u',
  v: 'v',
  w: 'w',
  x: 'x',
  y: 'y',
  z: 'z',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'H',
  I: 'I',
  J: 'J',
  K: 'K',
  L: 'L',
  M: 'M',
  N: 'N',
  O: 'O',
  P: 'P',
  Q: 'Q',
  R: 'R',
  S: 'S',
  T: 'T',
  U: 'U',
  V: 'V',
  W: 'W',
  X: 'X',
  Y: 'Y',
  Z: 'Z',
}

const PROSEMIRROR_KEYBOARD_SPECIAL: SpecialKeys = {
  ExclamationMark: '!',
  DoubleQuote: '"',
  Hash: '#',
  Dollar: '$',
  Percent: '%',
  Ampersand: '&',
  Apostrophe: "'",
  LeftParenthesis: '(',
  RightParenthesis: ')',
  Asterisk: '*',
  Plus: '+',
  Comma: ',',
  Minus: '-',
  Period: '.',
  Slash: '/',
  Colon: ':',
  Semicolon: ';',
  LeftAngleBracket: '<',
  Equals: '=',
  RightAngleBracket: '>',
  QuestionMark: '?',
  At: '@',
  LeftBracket: '[',
  Backslash: '\\',
  RightBracket: ']',
  Caret: '^',
  Underscore: '_',
  Backtick: '`',
  LeftBrace: '{',
  Pipe: '|',
  RightBrace: '}',
  Tilde: '~',
}

const PROSEMIRROR_KEYBOARD_FN_KEYS: FnKeys = {
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
}

export const PROSEMIRROR_KEYBOARD_SYMBOLS: ProsemirrorKeySymbols = {
  /** (symbol) `ArrowLeft` key */
  ['←']: 'ArrowLeft',
  /** (symbol) `ArrowRight` key */
  ['→']: 'ArrowRight',
  /** (symbol) `ArrowUp` key */
  ['↑']: 'ArrowUp',
  /** (symbol) `ArrowDown` key */
  ['↓']: 'ArrowDown',
  /** (symbol) `Enter` key */
  ['↩']: 'Enter',
  /** (symbol) `Backspace` key */
  ['⌫']: 'Backspace',
  /** (symbol) `Tab` key */
  ['⇥']: 'Tab',
  /** (symbol) `Command (Ctrl)` key */
  ['⌘']: 'Mod',
  /** (symbol) `Control` key */
  ['⌃']: 'Ctrl',
  /** (symbol) `Option (Alt)` key*/
  ['⌥']: 'Alt',
  /** (symbol) `Shift` key */
  ['⇧']: 'Shift',
  /** (symbol) `Delete` key */
  ['␡']: 'Delete',
}

export const PROSEMIRROR_KEYBOARD: Omit<ProsemirrorKeyboard, keyof ProsemirrorKeySymbols> & {
  SYMBOLS: ProsemirrorKeySymbols
} = {
  ...PROSEMIRROR_KEYBOARD_NUMBER,
  ...PROSEMIRROR_KEYBOARD_ALPHABET,
  ...PROSEMIRROR_KEYBOARD_PM_KEYS,
  ...PROSEMIRROR_KEYBOARD_SPECIAL,
  ...PROSEMIRROR_KEYBOARD_FN_KEYS,
  SYMBOLS: PROSEMIRROR_KEYBOARD_SYMBOLS,
}

/**
 * Prosemirror shortcut(keymap) 플러그인에서 사용할 Keybinding 키 생성을 도와주는 유틸 함수
 *
 * @example
 * ```ts
 * combineProsemirrorKeys('Mod', 'b') // 'Mod-b'
 * combineProsemirrorKeys('⌘', 'b') // 'Mod-b'
 *
 * combineProsemirrorKeys('⌘', PROSEMIRROR_KEYBOARD.Alt, '1') // 'Mod-Alt-1'
 * ```
 */
export const combineProsemirrorKeys = <Keys extends CombineProsemirrorKey[]>(...keys: Keys) => {
  return keys
    .map((key) =>
      Object.keys(PROSEMIRROR_KEYBOARD_SYMBOLS).includes(key)
        ? PROSEMIRROR_KEYBOARD_SYMBOLS[key as keyof ProsemirrorKeySymbols]
        : key,
    )
    .join('-') as CombineProsemirrorKeys<Keys>
}
