import { MarkType, NodeType } from 'prosemirror-model'
import { Command, Plugin } from 'prosemirror-state'

import { Editor } from '../editor'
import {
  Extension,
  ExtensionMarkSpec,
  ExtensionNodeSpec,
  MarkExtension,
  NodeExtension,
} from '../prose-mirror/extensions'
import { MergeCommands } from './command'

export type DynamicAttrsValue = number | string | boolean | null

export type AnyExtension = Extension<any, any> | NodeExtension<any, any> | MarkExtension<any, any>

export interface KeyBinding {
  [key: string]: Command
}

export type ExtensionConfigKeys = 'commands' | 'shortcut' | 'plugins' | 'utils'

/**
 * @example
 * ```ts
 * MergeConfigMapField<{} | null | undefined | unknown> // null
 * ```
 */
export type MergeConfigMapField<O> = keyof O extends never ? null : O

export type MergeConfigMap<
  T extends {
    name: ExtensionName
    commands?: ExtensionCommands
    shortcut?: ExtensionShortcut
    utils?: ExtensionUtils
  },
> = ExtensionConfigMap<{
  name: T['name']
  commands: MergeConfigMapField<T['commands'] & {}>
  utils: MergeConfigMapField<T['utils'] & {}>
  shortcut: MergeConfigMapField<T['shortcut'] & {}>
}>

export type MergeConfig<T extends ExtensionConfigBase> = {
  [K in keyof T as keyof T[K] extends never ? never : K]-?: T[K]
}

/* base type */

export type ExtensionName = string
export type ExtensionCommands = Record<any, any> | null
export type ExtensionShortcut = Record<any, Command> | null
export type ExtensionUtils = Record<any, any> | null
export type ExtensionOptions = Record<any, any> | null

export type MergeOptions<Options extends ExtensionOptions> = Options extends null
  ? { options?: null }
  : { options: Options }

export type EmptyExtensionConfigMap<Name extends ExtensionName = string> = {
  name: Name
  commands: null
  shortcut: null
  utils: null
}

export interface ExtensionConfigBase<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> {
  /**
   * extension 이름
   * - `snake_case` 로 명명
   */
  name: ConfigMap['name']
  /**
   * extension 우선순위
   * - 숫자가 높을수록 우선순위가 높으며, 낮을수록 우선순위가 낮아짐
   * - 해당 extension이 다른 extension 보다 먼저 적용되야 하는 경우 활용 (editor init 할 때, extension 배열을 순회하면서 적용되기 때문에 기본적으로는 배열의 순서에 따라 조정되기 때문에)
   */
  priority?: number | null
  commands?: (param: ConfigBaseParam<Options> & any) => ConfigMap['commands']
  shortcut?: (param: ConfigBaseParam<Options> & any) => ConfigMap['shortcut']
  plugins?: (param: ConfigBaseParam<Options> & any) => Plugin[]
  utils?: (param: ConfigBaseParam<Options> & any) => ConfigMap['utils']
}

export interface ConfigBaseParam<Options extends ExtensionOptions = null> {
  editor: Editor
  options: Options
}

export interface ExtensionConfigMap<
  T extends {
    name: ExtensionName
    commands: ExtensionCommands
    shortcut: ExtensionShortcut
    utils: ExtensionUtils
  } = any,
> {
  name: T['name']
  commands: T['commands']
  shortcut: T['shortcut']
  utils: T['utils']
}

export type ExtendConfigMap<
  Extension extends NodeExtension<any, any> | MarkExtension<any, any>,
  Override extends Partial<ExtensionConfigMap> = {},
> = {
  name: Override['name'] extends ExtensionName ? Override['name'] : Extension['name']
  commands: Override['commands'] extends ExtensionCommands
    ? Override['commands']
    : Extension['commands']
  shortcut: Override['shortcut'] extends ExtensionShortcut
    ? Override['shortcut']
    : Extension['shortcut']
  utils: Override['utils'] extends ExtensionUtils ? Override['utils'] : Extension['utils']
}

export type ExtendConfigParam<
  Param extends Record<any, any> = {},
  Options extends ExtensionOptions = null,
> = ConfigBaseParam<Options> & Param

export type ConfigParameters<
  Config extends Record<any, any>,
  Key extends ExtensionConfigKeys,
> = Config[Key] extends null | undefined ? never : Parameters<Config[Key]>

export type ExtensionConstuctorProps<
  Config extends ExtensionConfigBase = ExtensionConfigBase,
  Options extends ExtensionOptions = null,
> = Config & MergeOptions<Options>

/* extend type */

export type ExtendName<
  Name extends ExtensionName,
  OverrrideName extends string = '',
> = OverrrideName extends '' ? Name : OverrrideName

export type ExtendSpec<
  Param extends { spec: ExtensionNodeSpec | ExtensionMarkSpec; utils: ExtensionUtils },
> = (this: { spec: Param['spec']; utils: Param['utils'] }) => Param['spec']

export type ExtendNodeCommands<
  Param extends { commands: ExtensionCommands; utils: ExtensionUtils; options: ExtensionOptions },
  ReturnCommands extends ExtensionCommands,
> = (this: {
  editor: Editor
  commands: Param['commands']
  utils: Param['utils']
  options: Param['options']
  nodeType: NodeType
}) => MergeConfigMapField<ReturnCommands>

export type ExtendMarkCommands<
  Param extends { commands: ExtensionCommands; utils: ExtensionUtils },
  ReturnCommands extends ExtensionCommands,
> = (this: {
  editor: Editor
  commands: Param['commands']
  utils: Param['utils']
  markType: MarkType
}) => MergeConfigMapField<ReturnCommands>

export type ExtendShortcut<
  ConfigMap extends {
    commands: ExtensionCommands
    shortcut: ExtensionShortcut
  },
  Type extends 'Node' | 'Mark',
  ReturnShortcut extends ExtensionShortcut,
> = Type extends 'Node'
  ? (this: {
      shortcut: ConfigMap['shortcut']
      commands: MergeCommands<ConfigMap['commands']>
      nodeType: NodeType
    }) => ReturnShortcut
  : (this: {
      shortcut: ConfigMap['shortcut']
      commands: MergeCommands<ConfigMap['commands']>
      markType: MarkType
    }) => ReturnShortcut

export type ExtendUtils<Utils extends ExtensionUtils, ReturnUtils extends ExtensionUtils> = (this: {
  editor: Editor
  utils: Utils
}) => ReturnUtils

export type ExtendPlugins<Options extends ExtensionOptions> = (this: {
  plugins: Plugin[]
  options: Options
}) => Plugin[]

export type ExtendOptions<
  Options extends ExtensionOptions,
  OverrideOptions extends ExtensionOptions = Options,
> = (this: { options: Options }) => OverrideOptions
