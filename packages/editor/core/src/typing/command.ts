import { Command } from 'prosemirror-state'

export type MergeCommands<Commands> = PureCommands<Commands> & FnCommands<Commands>

export type PureCommands<Commands> = {
  [K in keyof Commands as Commands[K] extends Command ? K : never]: Commands[K]
}
export type FnCommands<Commands> = {
  [K in keyof Commands as Commands[K] extends RawCommand | MaybeExcuteCommand
    ? K
    : never]: Commands[K]
}

export type RawCommand = (...args: any[]) => Command
export type MaybeExcuteCommand = (...args: any[]) => ReturnType<Command>

export type SingleCommand = Command | RawCommand | MaybeExcuteCommand

export type CommandParams<TargetCommand extends SingleCommand> = TargetCommand extends Command
  ? Parameters<Command>
  : Parameters<TargetCommand>

export type CanCommandParams<TargetCommand extends SingleCommand> = TargetCommand extends Command
  ? []
  : Parameters<TargetCommand>

type ExcludeCanCommand<Commands, CustomKey extends string = 'can'> = MergeCommands<
  Omit<Commands, CustomKey>
>
type ExlcudeCanKeyFromCommands<
  Commands,
  CustomKey extends string = 'can',
> = keyof ExcludeCanCommand<Commands, CustomKey>
export type CanCommandFnKeys<
  Commands,
  ExcludeKeys extends ExlcudeCanKeyFromCommands<Commands> = never,
  CustomKey extends string = 'can',
> = Exclude<ExlcudeCanKeyFromCommands<Commands, CustomKey>, ExcludeKeys>
export type CanCommandFn<
  Commands,
  ExcludeKeys extends ExlcudeCanKeyFromCommands<Commands> = never,
  CustomKey extends string = 'can',
> = (key: CanCommandFnKeys<Commands, ExcludeKeys, CustomKey>) => boolean
