export const gcd: (a: number, b: number) => number = (a, b) => {
  return b === 0 ? a : gcd(b, a % b)
}

export * from './content'
export * from './has-type'
export * from './image'
export * from './keyboard'
export * from './mark'
export * from './node'
export * from './parse-string'
export * from './selection'
