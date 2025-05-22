import { Command } from '@codemirror/view'

export type CommandMap = Record<any, Command>

export type PickCommands<M extends Record<any, any>> = {
  [K in keyof M as M[K] extends Command ? K : never]: M[K]
}
