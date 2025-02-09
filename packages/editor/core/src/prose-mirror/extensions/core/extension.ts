import { Plugin } from 'prosemirror-state'

import {
  AnyExtension,
  ConfigParameters,
  EmptyExtensionConfigMap,
  ExtendConfigParam,
  ExtensionConfigBase,
  ExtensionConfigKeys,
  ExtensionConfigMap,
  ExtensionConstuctorProps,
  ExtensionOptions,
} from '../../../typing'
import { ExtensionBase } from './base'
import { DynamicMarkAttributeOutputSpec } from './mark-extension'
import { DynamicNodeAttributeOutputSpec } from './node-extension'

export interface ExtensionConfig<
  ConfigMap extends ExtensionConfigMap = ExtensionConfigMap<EmptyExtensionConfigMap>,
  Options extends ExtensionOptions = null,
> extends ExtensionConfigBase<ConfigMap, Options> {
  utils?: (param: ExtendConfigParam<{}, Options>) => ConfigMap['utils']
  commands?: (
    param: ExtendConfigParam<{ utils: ConfigMap['utils'] }, Options>,
  ) => ConfigMap['commands']
  shortcut?: (
    param: ExtendConfigParam<
      { commands: ConfigMap['commands']; utils: ConfigMap['utils'] },
      Options
    >,
  ) => ConfigMap['shortcut']
  plugins?: (
    param: ExtendConfigParam<
      {
        commands: ConfigMap['commands']
        shortcut: ConfigMap['shortcut']
        utils: ConfigMap['utils']
      },
      Options
    >,
  ) => Plugin[]
  attributeSpec?: (
    param: ExtendConfigParam<{}, Options>,
  ) => (DynamicNodeAttributeOutputSpec | DynamicMarkAttributeOutputSpec)[]
}

/**
 * 에디터에서 사용할 플러그인을 생성하고 적용하기 위한 클래스
 *
 * - Node 또는 Mark 생성이 필요하지 않으며 개별적인 단축키(shortcut), 커스텀 플러그인을 제공하는 목적으로 사용하기에 적합
 */
export class Extension<
  ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
  Options extends ExtensionOptions = null,
> extends ExtensionBase<ConfigMap, Options> {
  readonly config: ExtensionConfig<ConfigMap, Options>

  private constructor({
    name,
    priority = null,
    options,
    attributeSpec,
    ...config
  }: ExtensionConstuctorProps<ExtensionConfig<ExtensionConfigMap<ConfigMap>, Options>, Options>) {
    super({ name, options, priority, ...config } as any)

    this.config = {
      name,
      priority,
      attributeSpec: (attributeSpec ?? null) as ExtensionConfig<
        ExtensionConfigMap<ConfigMap>,
        Options
      >['attributeSpec'],
      ...config,
    }
  }

  static create<
    ConfigMap extends ExtensionConfigMap = EmptyExtensionConfigMap,
    Options extends ExtensionOptions = null,
  >(
    props: ExtensionConstuctorProps<
      ExtensionConfig<ExtensionConfigMap<ConfigMap>, Options>,
      Options
    >,
  ) {
    return new Extension<ConfigMap, Options>({ ...props })
  }

  static isExtension = (anyExtension: AnyExtension): anyExtension is Extension<any, any> => {
    return anyExtension instanceof Extension
  }

  // @ts-ignore
  configure<Key extends ExtensionConfigKeys>(
    key: Key,
    ...param: ConfigParameters<ExtensionConfig<ExtensionConfigMap<ConfigMap>, Options>, Key>
  ) {
    return super.configure(key, ...param)
  }
}
