import { keydownHandler } from 'prosemirror-keymap'
import { Attrs, ParseRule, StyleParseRule, TagParseRule } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'

import {
  AnyExtension,
  EmptyExtensionConfigMap,
  ExtensionConfigBase,
  ExtensionConfigKeys,
  ExtensionConfigMap,
  ExtensionConstuctorProps,
  ExtensionOptions,
  MergeConfigMapField,
} from '../../../typing'

export const parseRuleIsStyleParseRule = (rule: ParseRule): rule is StyleParseRule => {
  return 'style' in rule
}

export const parseRuleIsTagParseRule = (rule: ParseRule): rule is TagParseRule => {
  return !('style' in rule)
}

export const mergeNonNullableAttrs = (attrs?: Attrs | null) => {
  if (!attrs) return {}

  return Array.from(Object.entries(attrs)).reduce((attributes, [key, attr]) => {
    if (attr === undefined)
      return {
        ...attributes,
      }

    if (attr === '')
      return {
        ...attributes,
      }

    return {
      ...attributes,
      [key]: attr,
    }
  }, {})
}

/**
 * 에디터 extension의 기본 클래스
 * - `Extension`, `NodeExtension`, `MarkExtension` 은 `ExtensionBase` 클래스를 확장(`extends`)해서 구현
 */
export class ExtensionBase<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> {
  readonly config: ExtensionConfigBase<ConfigMap, Options>
  readonly priority: number

  extendedFrom: AnyExtension | null = null

  options: Options

  protected _name: ConfigMap['name']
  protected _commands: ConfigMap['commands']
  protected _shortcut: ConfigMap['shortcut']
  protected _plugins?: Plugin[] | null
  protected _keymapPlugin: Plugin | null
  protected _utils: ConfigMap['utils']

  constructor({
    name,
    priority = null,
    commands,
    shortcut,
    plugins,
    options = null,
    utils,
  }: ExtensionConstuctorProps<ExtensionConfigBase<ConfigMap, Options>, Options>) {
    this._name = name
    this.priority = priority ?? 50
    this.config = {
      name,
      priority,
      commands,
      shortcut,
      plugins,
      utils,
    }

    this.options = options as Options

    this.configFieledThisBindSelf = this.configFieledThisBindSelf.bind(this)

    this._commands = commands ? {} : null
    this._shortcut = shortcut ? {} : null
    this._plugins = plugins ? [] : null
    this._keymapPlugin = null
    this._utils = utils ? {} : null
  }

  get name() {
    return this._name
  }

  get commands() {
    return this.configFieledThisBindSelf(this._commands)
  }

  get shortcut() {
    return this._shortcut
  }

  get plugins() {
    return this._plugins
  }

  get keymapPlugin() {
    return this._keymapPlugin
  }

  get utils() {
    return this.configFieledThisBindSelf(this._utils)
  }

  private configFieledThisBindSelf<Self extends Record<any, any> | null>(self: Self): Self {
    if (self === null) return self as Self

    return Array.from(Object.entries(self)).reduce((_self, [key, value]) => {
      return {
        ..._self,
        [key]: typeof value === 'function' ? value.bind(self) : value,
      }
    }, {} as Self)
  }

  configureOptions = (
    options: MergeConfigMapField<Options> extends null ? never : Partial<Options>,
  ) => {
    if (this.options === null) return this

    this.options = {
      ...this.options,
      ...options,
    } as Options

    return this
  }

  protected configure<Key extends ExtensionConfigKeys>(
    this: AnyExtension,
    key: Key,
    ...param: any[]
  ) {
    const extension = this as ExtensionBase<any, any>
    const parameter = param[0] as any

    switch (key) {
      case 'utils':
        if (extension.config['utils']) {
          extension._utils = extension.config['utils'](parameter)
        }

        return extension
      case 'commands':
        if (extension.config['commands']) {
          extension._commands = extension.config['commands'](parameter)
        }

        return extension
      case 'shortcut':
        if (extension.config['shortcut']) {
          const shortcut = extension.config['shortcut'](parameter)
          extension._shortcut = shortcut

          extension._keymapPlugin = new Plugin({
            key: new PluginKey(`${extension.name}-keymap`),
            props: {
              handleKeyDown: keydownHandler(shortcut),
            },
          })
        }

        return extension
      case 'plugins':
        if (extension.config['plugins']) {
          extension._plugins = extension.config['plugins'](parameter)
        }

        return extension
    }

    return extension
  }
}
