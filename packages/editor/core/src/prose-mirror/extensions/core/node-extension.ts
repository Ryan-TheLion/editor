import { cloneDeep } from 'lodash-es'
import { AttributeSpec, Attrs, DOMOutputSpec, Node, NodeSpec, NodeType } from 'prosemirror-model'
import { nodes } from 'prosemirror-schema-basic'
import { Plugin } from 'prosemirror-state'

import {
  ConfigBaseParam,
  ConfigParameters,
  EmptyExtensionConfigMap,
  ExtendConfigParam,
  ExtendNodeCommands,
  ExtendOptions,
  ExtendPlugins,
  ExtendShortcut,
  ExtendSpec,
  ExtendUtils,
  ExtensionConfigBase,
  ExtensionConfigKeys,
  ExtensionConfigMap,
  ExtensionConstuctorProps,
  ExtensionOptions,
} from '../../../typing'
import { ExtensionBase } from './base'

export type ExtensionNodeSpec = {
  [K in keyof NodeSpec as K extends 'toDOM' ? never : K]: NodeSpec[K]
} & { toDOM?: (node: Node, attributes: Attrs) => DOMOutputSpec }

export interface NodeExtensionConfig<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> extends ExtensionConfigBase<ConfigMap, Options> {
  topNode?: boolean
  nodeSpec?: (props: ConfigBaseParam<Options>) => ExtensionNodeSpec
  extendProseMirrorBaseNodeSpec?: {
    key: keyof typeof nodes
    spec?: (props: { baseNodeSpec: NodeSpec; options: Options }) => ExtensionNodeSpec
  }
  utils?: (param: ExtendConfigParam<{ nodeType: NodeType }, Options>) => ConfigMap['utils']
  commands?: (
    param: ExtendConfigParam<
      {
        nodeType: NodeType
        utils: ConfigMap['utils']
      },
      Options
    >,
  ) => ConfigMap['commands']
  shortcut?: (
    param: ExtendConfigParam<
      {
        nodeType: NodeType
        commands: ConfigMap['commands']
        utils: ConfigMap['utils']
      },
      Options
    >,
  ) => ConfigMap['shortcut']
  plugins?: (
    param: ExtendConfigParam<
      {
        nodeType: NodeType
        commands: ConfigMap['commands']
        shortcut: ConfigMap['shortcut']
        utils: ConfigMap['utils']
      },
      Options
    >,
  ) => Plugin[]
}

export interface DynamicNodeAttributeConfig extends AttributeSpec {
  parseDOM?: (dom: HTMLElement) => string | number | boolean | null
  toDOM?: (node: Node) => Attrs | null
}

export interface DynamicNodeAttributeSpec {
  extensions?: string[] | readonly string[]
  attributes: Record<string, DynamicNodeAttributeConfig>
}

export interface DynamicNodeAttributeOutputSpec {
  $$typeof: Symbol
  extensions?: string[] | readonly string[]
  attrs: Record<string, AttributeSpec>
  parseDOM?: (dom: HTMLElement) => Attrs
  toDOM?: (node: Node) => Attrs | null
}

/**
 * 에디터에서 사용할 prosemirror `Node` 를 생성하고 적용하기 위한 클래스
 */
export class NodeExtension<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> extends ExtensionBase<ConfigMap, Options> {
  private static DynamicNodeAttributeKey = Symbol('dynamicNodeAttributes')

  readonly config: NodeExtensionConfig<ConfigMap, Options>

  nodeType!: NodeType

  protected constructor({
    name,
    priority = null,
    nodeSpec,
    extendProseMirrorBaseNodeSpec,
    options = null,
    ...config
  }: ExtensionConstuctorProps<NodeExtensionConfig<ConfigMap, Options>, Options>) {
    super({ name, options, priority, ...config } as any)

    this.config = {
      name,
      priority,
      nodeSpec,
      extendProseMirrorBaseNodeSpec,
      ...config,
    }
  }

  static create<
    ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
    Options extends ExtensionOptions = null,
  >({ ...props }: ExtensionConstuctorProps<NodeExtensionConfig<ConfigMap, Options>, Options>) {
    return new NodeExtension<ConfigMap, Options>({
      ...props,
    })
  }

  static isDynamicNodeAttibuteOutput = (value: any): value is DynamicNodeAttributeOutputSpec => {
    return '$$typeof' in value && value.$$typeof === NodeExtension.DynamicNodeAttributeKey
  }

  static createDynamicAttribute = (
    config: DynamicNodeAttributeSpec,
  ): DynamicNodeAttributeOutputSpec => {
    const { extensions, attributes } = config

    if (!Object.keys(attributes).length)
      throw new Error('최소 1개 이상의 attribute가 존재해야 합니다')

    const convertConfig = {
      parseDOM: (
        key: string,
        config: DynamicNodeAttributeConfig['parseDOM'],
      ): ((dom: HTMLElement) => Attrs) | null => {
        if (!config) return null

        return (dom) => {
          return {
            [key]: config(dom),
          }
        }
      },
      toDOM: (
        key: string,
        config: DynamicNodeAttributeConfig['toDOM'],
      ): ((node: Node) => Attrs | null) | null => {
        if (!config) return null

        return (node) => {
          return config(node)
        }
      },
    }

    const output: DynamicNodeAttributeOutputSpec = {
      $$typeof: NodeExtension.DynamicNodeAttributeKey,
      extensions,
      ...Array.from(Object.entries(attributes)).reduce(
        (configs, [key, attributeConfig]) => {
          const attrs = {
            ...configs.attrs,
            [key]: {
              default: attributeConfig.default,
              validate: attributeConfig.validate,
            },
          }
          const parseDOM = convertConfig.parseDOM(key, attributeConfig.parseDOM)
          const toDOM = convertConfig.toDOM(key, attributeConfig.toDOM)

          return {
            ...configs,
            ...(parseDOM && { parseDOM }),
            ...(toDOM && { toDOM }),
            attrs,
          }
        },
        {} as Pick<DynamicNodeAttributeOutputSpec, 'attrs' | 'parseDOM' | 'toDOM'>,
      ),
    }

    Object.defineProperty(output, '$$typeof', { enumerable: false })

    return output
  }

  // @ts-ignore
  configure<Key extends ExtensionConfigKeys>(
    key: Key,
    ...param: ConfigParameters<NodeExtensionConfig<ExtensionConfigMap<ConfigMap>, Options>, Key>
  ) {
    return super.configure(key, ...param)
  }

  extendAs<
    OverrideConfigMap extends ExtensionConfigMap = {
      name: ConfigMap['name']
      commands: ConfigMap['commands']
      shortcut: ConfigMap['shortcut']
      utils: ConfigMap['utils']
    },
    OverrideOptions extends ExtensionOptions = Options,
  >({
    name,
    spec,
    commands,
    shortcut,
    utils,
    options,
    plugins,
  }: {
    name?: OverrideConfigMap['name']
    spec?: ExtendSpec<{ spec: ExtensionNodeSpec; utils: ConfigMap['utils'] }>
    commands?: ExtendNodeCommands<
      {
        commands: ExtensionConfigMap<ConfigMap>['commands']
        utils: OverrideConfigMap['utils']
        options: OverrideOptions
      },
      OverrideConfigMap['commands']
    >
    shortcut?: ExtendShortcut<
      {
        commands: OverrideConfigMap['commands']
        shortcut: OverrideConfigMap['shortcut']
      },
      'Node',
      OverrideConfigMap['shortcut']
    >
    utils?: ExtendUtils<ConfigMap['utils'], OverrideConfigMap['utils']>
    options?: ExtendOptions<Options, OverrideOptions>
    plugins?: ExtendPlugins<OverrideOptions>
  }) {
    const extension = this
    const cloneExtension = cloneDeep(this)

    const extendConfig = {
      name,
      spec,
      commands,
      shortcut,
      utils,
      options,
      plugins,
    }

    // @ts-ignore
    const extendExtension = NodeExtension.create<OverrideConfigMap, OverrideOptions>({
      name: name ?? this.name,
      options: extendConfig?.options
        ? extendConfig.options.call({ options: extension.options })
        : extension.options,
      nodeSpec({ editor }) {
        const baseExtensionNodeSpec = extension.config.extendProseMirrorBaseNodeSpec?.spec
          ? extension.config.extendProseMirrorBaseNodeSpec.spec({
              baseNodeSpec: nodes[extension.config.extendProseMirrorBaseNodeSpec.key]!,
              options: extension.options,
            })
          : extension.config.nodeSpec!({
              editor,
              options: extension.options,
            })

        if (extendConfig?.spec) {
          cloneExtension.configure('utils', {
            editor,
            nodeType: extension.nodeType,
            options: extension.options,
          })

          return extendConfig.spec.call({
            spec: baseExtensionNodeSpec,
            utils: cloneExtension.utils,
          })
        }

        return baseExtensionNodeSpec
      },
      commands({ editor, nodeType, utils, options }) {
        return (
          extendConfig?.commands?.call({
            commands: extension.commands,
            nodeType,
            editor,
            utils,
            options,
          }) ??
          extension.commands ??
          null
        )
      },
      shortcut({ nodeType, commands }) {
        return (
          extendConfig?.shortcut?.call({
            commands,
            shortcut: extension.shortcut,
            nodeType,
          }) ??
          extension.shortcut ??
          null
        )
      },
      utils({ editor }) {
        return (
          extendConfig?.utils?.call({ editor, utils: extension.utils }) ?? extension.utils ?? null
        )
      },
      plugins({ options }) {
        return (
          extendConfig?.plugins?.call({ plugins: extension.plugins ?? [], options }) ??
          extension.plugins ??
          null
        )
      },
    })

    extendExtension.extendedFrom = extension

    return extendExtension
  }
}
