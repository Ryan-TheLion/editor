import {
  AttributeSpec,
  Attrs,
  DOMOutputSpec,
  Mark,
  MarkSpec,
  MarkType,
  StyleParseRule,
} from 'prosemirror-model'
import { marks } from 'prosemirror-schema-basic'
import { Plugin } from 'prosemirror-state'

import {
  ConfigParameters,
  DynamicAttrsValue,
  EmptyExtensionConfigMap,
  ExtendConfigParam,
  ExtendMarkCommands,
  ExtendOptions,
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

export type ExtensionMarkSpec = {
  [K in keyof MarkSpec as K extends 'toDOM' ? never : K]: MarkSpec[K]
} & { toDOM?: (mark: Mark, inline: boolean, attributes: Attrs) => DOMOutputSpec }

export interface MarkExtensionConfig<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> extends ExtensionConfigBase<ConfigMap, Options> {
  markSpec?: (props: { options: Options }) => ExtensionMarkSpec
  extendProseMirrorBaseMarkSpec?: {
    key: keyof typeof marks
    spec?: (props: { baseMarkSpec: MarkSpec; options: Options }) => ExtensionMarkSpec
  }
  utils?: (param: ExtendConfigParam<{ markType: MarkType }, Options>) => ConfigMap['utils']
  commands?: (
    param: ExtendConfigParam<{ markType: MarkType; utils: ConfigMap['utils'] }, Options>,
  ) => ConfigMap['commands']
  shortcut?: (
    param: ExtendConfigParam<
      { markType: MarkType; commands: ConfigMap['commands']; utils: ConfigMap['utils'] },
      Options
    >,
  ) => ConfigMap['shortcut']
  plugins?: (
    param: ExtendConfigParam<
      {
        markType: MarkType
        commands: ConfigMap['commands']
        shortcut: ConfigMap['shortcut']
        utils: ConfigMap['utils']
      },
      Options
    >,
  ) => Plugin[]
}

export interface MarkAttributeStyleRule extends Omit<StyleParseRule, 'attrs' | 'getAttrs'> {
  getAttrs: (styleValue: string) => DynamicAttrsValue
}

export interface MarkAttributeParseDOMConfig {
  (dom: HTMLElement | string, matchedStyle?: string): DynamicAttrsValue
}

export interface MarkAttributeOutputSpecParseDOM {
  (dom: HTMLElement | string, matchedStyle?: string): Attrs
}

export interface DynamicMarkAttributeConfig extends AttributeSpec {
  styleRules?: MarkAttributeStyleRule[]
  parseDOM?: MarkAttributeParseDOMConfig
  toDOM?: (mark: Mark, inline: boolean) => Attrs | null
}

export interface DynamicMarkAttributeSpec {
  extensions?: string[] | readonly string[]
  attributes: Record<string, DynamicMarkAttributeConfig>
}

export interface DynamicMarkAttributeOutputSpec {
  $$typeof: Symbol
  extensions?: string[] | readonly string[]
  attrs: Record<string, AttributeSpec>
  styleRules?: StyleParseRule[]
  parseDOM?: MarkAttributeOutputSpecParseDOM
  toDOM?: (mark: Mark, inline: boolean) => Attrs | null
}

/**
 * 에디터에서 사용할 prosemirror `Mark` 를 생성하고 적용하기 위한 클래스
 */
export class MarkExtension<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> extends ExtensionBase<ConfigMap, Options> {
  private static DynamicMarkAttributeKey = Symbol('dynamicMarkAttributes')

  readonly config: MarkExtensionConfig<ExtensionConfigMap<ConfigMap>, Options>

  markType!: MarkType

  private constructor({
    name,
    priority = null,
    markSpec,
    extendProseMirrorBaseMarkSpec,
    options,
    ...config
  }: ExtensionConstuctorProps<MarkExtensionConfig<ConfigMap, Options>, Options>) {
    super({ name, options: options as any, priority, ...config } as any)

    this.config = {
      name,
      priority,
      markSpec,
      extendProseMirrorBaseMarkSpec,
      ...config,
    }
  }

  static create<
    ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
    Options extends ExtensionOptions = null,
  >(props: ExtensionConstuctorProps<MarkExtensionConfig<ConfigMap, Options>, Options>) {
    return new MarkExtension<ConfigMap, Options>({ ...props })
  }

  static isDynamicMarkAttributeOutput = (value: any): value is DynamicMarkAttributeOutputSpec => {
    return '$$typeof' in value && value.$$typeof === MarkExtension.DynamicMarkAttributeKey
  }

  static createDynamicAttribute = (
    config: DynamicMarkAttributeSpec,
  ): DynamicMarkAttributeOutputSpec => {
    const { extensions, attributes } = config

    if (!Object.keys(attributes).length)
      throw new Error('최소 1개 이상의 attribute가 존재해야 합니다')

    const convertConfig = {
      parseDOM: (
        key: string,
        config: DynamicMarkAttributeConfig['parseDOM'],
      ): MarkAttributeOutputSpecParseDOM | null => {
        if (!config) return null

        return (dom, matchedStyle) => {
          if (typeof dom === 'string')
            return {
              [key]: config(dom, matchedStyle),
            }

          return {
            [key]: config(dom),
          }
        }
      },
      toDOM: (
        key: string,
        config: DynamicMarkAttributeConfig['toDOM'],
      ): ((mark: Mark, inline: boolean) => Attrs | null) | null => {
        if (!config) return null

        return (mark, inline) => {
          return config(mark, inline)
        }
      },
      styleRules: (
        key: string,
        config: DynamicMarkAttributeConfig['styleRules'],
      ): StyleParseRule[] | null => {
        if (!config) return null

        return Array.from(config).map((attributeStyleRule) => {
          const { getAttrs: attributeGetAttrs, ...rule } = attributeStyleRule

          return {
            ...rule,
            getAttrs(value) {
              return {
                [key]: attributeGetAttrs(value),
              }
            },
          }
        })
      },
    }

    const output: DynamicMarkAttributeOutputSpec = {
      $$typeof: MarkExtension.DynamicMarkAttributeKey,
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

          const styleRules = convertConfig.styleRules(key, attributeConfig.styleRules)
          const parseDOM = convertConfig.parseDOM(key, attributeConfig.parseDOM)
          const toDOM = convertConfig.toDOM(key, attributeConfig.toDOM)

          return {
            ...configs,
            ...(styleRules && { styleRules }),
            ...(parseDOM && { parseDOM }),
            ...(toDOM && { toDOM }),
            attrs,
          }
        },
        {} as Pick<DynamicMarkAttributeOutputSpec, 'attrs' | 'parseDOM' | 'toDOM' | 'styleRules'>,
      ),
    }

    Object.defineProperty(output, '$$typeof', { enumerable: false })

    return output
  }

  // @ts-ignore
  configure<Key extends ExtensionConfigKeys>(
    key: Key,
    ...param: ConfigParameters<MarkExtensionConfig<ExtensionConfigMap<ConfigMap>, Options>, Key>
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
    OverrideOptions extends ExtensionOptions = null,
  >({
    name,
    spec,
    commands,
    shortcut,
    utils,
    options,
  }: {
    name?: OverrideConfigMap['name']
    spec?: ExtendSpec<{ spec: ExtensionMarkSpec; utils: ConfigMap['utils'] }>
    commands?: ExtendMarkCommands<
      {
        commands: ExtensionConfigMap<ConfigMap>['commands']
        utils: OverrideConfigMap['utils']
      },
      OverrideConfigMap['commands']
    >
    shortcut?: ExtendShortcut<
      {
        commands: OverrideConfigMap['commands']
        shortcut: OverrideConfigMap['shortcut']
      },
      'Mark',
      OverrideConfigMap['shortcut']
    >
    utils?: ExtendUtils<ConfigMap['utils'], OverrideConfigMap['utils']>
    options?: ExtendOptions<Options, OverrideOptions>
  }) {
    const extension = this

    const extendConfig = {
      name,
      spec,
      commands,
      shortcut,
      utils,
      options,
    }

    // @ts-ignore
    const extendExtension = MarkExtension.create<OverrideConfigMap, OverrideOptions>({
      name: name ?? this.name,
      options: extendConfig?.options
        ? extendConfig.options.call({ options: extension.options })
        : extension.options,
      markSpec() {
        const baseExtensionNodeSpec = extension.config.extendProseMirrorBaseMarkSpec?.spec
          ? extension.config.extendProseMirrorBaseMarkSpec.spec({
              baseMarkSpec: marks[extension.config.extendProseMirrorBaseMarkSpec.key]!,
              options: extension.options,
            })
          : extension.config.markSpec!({
              options: extension.options,
            })

        if (extendConfig.spec) {
          return extendConfig.spec.call({
            spec: baseExtensionNodeSpec,
            utils: extension.utils ?? null,
          })
        }

        return baseExtensionNodeSpec
      },
      commands({ editor, markType, utils }) {
        return (
          extendConfig.commands?.call({ editor, commands: extension.commands, markType, utils }) ??
          extension.commands ??
          null
        )
      },
      shortcut({ markType, commands }) {
        return (
          extendConfig.shortcut?.call({
            commands,
            shortcut: extension.shortcut,
            markType,
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
    })

    return extendExtension
  }
}
