export type Axis = 'horiz' | 'vert'

export type TableDirectionKey = keyof typeof TABLE_DIRECTION

export const TABLE_DIRECTION = {
  AFTER: 1,
  BEFORE: -1,
} as const

export * from './cell'
export * from './header'
export * from './row'
export * from './table'
export * from './table-kit'
