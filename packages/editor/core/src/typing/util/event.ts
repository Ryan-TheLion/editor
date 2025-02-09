export type EventEmitterListener<T, K extends keyof T> = T extends [never]
  ? (...args: any[]) => void
  : K extends keyof T
    ? T[K] extends unknown[]
      ? (...args: T[K]) => void
      : never
    : never

export type EventEmitterHandlers<M> = {
  [Key in keyof M]: EventEmitterListener<M, Key>
}
