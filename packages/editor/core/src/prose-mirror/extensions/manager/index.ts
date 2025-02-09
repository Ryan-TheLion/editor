import { flattenDeep, mergeWith, unionWith } from 'lodash-es'
import {
  AttributeSpec,
  Attrs,
  Mark,
  MarkSpec,
  Node,
  NodeSpec,
  ParseRule,
  Schema,
  StyleParseRule,
  TagParseRule,
} from 'prosemirror-model'
import { marks, nodes } from 'prosemirror-schema-basic'
import { Plugin } from 'prosemirror-state'

import { Editor } from '../../../editor'
import { AnyExtension, ExtensionConfigMap } from '../../../typing'
import {
  DynamicMarkAttributeOutputSpec,
  DynamicNodeAttributeOutputSpec,
  Extension,
  ExtensionMarkSpec,
  ExtensionNodeSpec,
  MarkExtension,
  MarkExtensionConfig,
  mergeNonNullableAttrs,
  NodeExtension,
  NodeExtensionConfig,
} from '../core'

export type ExtensionList = Array<AnyExtension | AnyExtension[]>

interface AttributesOutputSpecMap {
  nodeExtension: DynamicNodeAttributeOutputSpec[]
  markExtension: DynamicMarkAttributeOutputSpec[]
}

export class ExtensionManager {
  editor: Editor

  #schema!: Schema
  #extensions!: AnyExtension[]
  #extensionPlugins: Plugin[] = []

  #topNode: string = 'doc'

  #attributesOutputSpecMap!: AttributesOutputSpecMap | null

  constructor({ editor, extensions }: { editor: Editor; extensions: ExtensionList }) {
    this.editor = editor

    this.injectExtensions(extensions)
  }

  get extensions() {
    return this.#extensions.length ? this.#extensions : null
  }

  get extensionPlugins() {
    return this.#extensionPlugins.length ? this.#extensionPlugins : null
  }

  static flattenExtensions = (extensions: ExtensionList) => {
    return unionWith(flattenDeep(extensions), (a, b) => a.name === b.name)
  }

  injectExtensions = (extensions: ExtensionList) => {
    this.#extensions = ExtensionManager.flattenExtensions(extensions)

    this.#attributesOutputSpecMap = this.getDynamicAttributesOutputSpec(this.#extensions)

    this.#schema = this.createSchema(this.#extensions)

    this.createExtensionPlugins({
      extensions: this.#extensions,
    })

    // this.#extensionPlugins = this.createExtensionPlugins({
    //   extensions: this.#extensions,
    // })
  }

  mergeAttributes = (attrs: Attrs, otherAttrs: Attrs): Attrs => {
    const inlineStyleToMap = (inlineStyle: string) => {
      if (!inlineStyle) return {}

      return inlineStyle
        .split(';')
        .map((prop) => prop.trim())
        .reduce(
          (styleMap, prop) => {
            return {
              ...styleMap,
              ...Object.fromEntries([prop.split(':').map((prop) => prop.trim())]),
            }
          },
          {} as Record<string, string>,
        )
    }

    return mergeWith(attrs, otherAttrs, (value, targetValue, key) => {
      if (key === 'class') {
        return value ? `${value} ${targetValue}` : `${targetValue}`
      }

      if (key === 'style') {
        return JSON.stringify({
          ...inlineStyleToMap(value),
          ...inlineStyleToMap(targetValue),
        })
          .replace(/^\{|\}$|["']/g, '')
          .replace(/[,]/g, ';')
      }
    })
  }

  getDynamicAttributesOutputSpec = (extensions: AnyExtension[]): AttributesOutputSpecMap | null => {
    const attributesConfigList = extensions
      .filter((extension) => Extension.isExtension(extension) && !!extension.config?.attributeSpec)
      .map((extension) => {
        const {
          options,
          config: { attributeSpec },
        } = extension as Extension<any, any>

        return attributeSpec!({ editor: this.editor, options })
      })
      .flat()

    if (!attributesConfigList.length) return null

    return {
      nodeExtension: attributesConfigList.filter((config) =>
        NodeExtension.isDynamicNodeAttibuteOutput(config),
      ),
      markExtension: attributesConfigList.filter((config) =>
        MarkExtension.isDynamicMarkAttributeOutput(config),
      ),
    }
  }

  mergeDynamicNodeAttribute = (key: string, extensionNodeSpec: ExtensionNodeSpec): NodeSpec => {
    const { toDOM: specToDOM, ...spec } = extensionNodeSpec

    const defaultNodeSpec: NodeSpec = {
      ...spec,
      ...(specToDOM && {
        toDOM(node) {
          return specToDOM(node, {})
        },
      }),
    }

    if (!this.#attributesOutputSpecMap?.nodeExtension?.length) return defaultNodeSpec

    const target = this.#attributesOutputSpecMap.nodeExtension.filter(
      (outputSpec) => !outputSpec?.extensions || outputSpec.extensions.includes(key),
    )

    if (!target.length) return defaultNodeSpec

    const outputSpecToDOMList = target
      .filter((outputSpec) => !!outputSpec?.toDOM)
      .map((outputSpec) => outputSpec.toDOM!)

    const getRenderSpecAttrs = (node: Node) => {
      if (!outputSpecToDOMList.length) return {}

      return outputSpecToDOMList.reduce((attrs, parse) => {
        return this.mergeAttributes(attrs, parse(node) ?? {})
      }, {} as Attrs)
    }

    const nodeSpecFields = Array.from(target).reduce(
      (fields, outputSpec) => {
        /* attrs */

        const attrs: Record<string, AttributeSpec> = {
          ...(spec?.attrs && spec.attrs),
          ...(fields?.attrs && fields.attrs),
          ...outputSpec.attrs,
        }

        /* parseDOM */

        const targetParseDOM = fields?.parseDOM ?? extensionNodeSpec?.parseDOM ?? []

        const parseDOM = targetParseDOM.map((rule: TagParseRule) => {
          const getAttrs: NonNullable<TagParseRule['getAttrs']> = (dom) => {
            const prevAttrs = rule.getAttrs?.(dom)
            const attrs = outputSpec.parseDOM?.(dom)

            if (prevAttrs === false) return false

            return {
              ...mergeNonNullableAttrs(prevAttrs),
              ...mergeNonNullableAttrs(attrs),
            }
          }

          return {
            ...rule,
            getAttrs,
          }
        })

        const toDOM = (node: Node) => {
          return specToDOM!(node, getRenderSpecAttrs(node))
        }

        return {
          ...fields,
          ...(spec.parseDOM?.length && { parseDOM }),
          ...(specToDOM && { toDOM }),
          ...(!['doc', 'text'].includes(key) && { attrs }),
        }
      },
      {} as Pick<NodeSpec, 'parseDOM' | 'toDOM' | 'attrs'>,
    )

    return {
      ...spec,
      ...nodeSpecFields,
    }
  }

  mergeDynamicMarkAttribute = (key: string, extensionMarkSpec: ExtensionMarkSpec) => {
    const { toDOM: specToDOM, ...spec } = extensionMarkSpec

    const defaultMarkSpec: MarkSpec = {
      ...spec,
      ...(specToDOM && {
        toDOM(mark, inline) {
          return specToDOM(mark, inline, {})
        },
      }),
    }

    if (!this.#attributesOutputSpecMap?.markExtension?.length) return defaultMarkSpec

    const target = this.#attributesOutputSpecMap.markExtension.filter(
      (outputSpec) => !outputSpec?.extensions || outputSpec.extensions.includes(key),
    )

    if (!target.length) return defaultMarkSpec

    const styleRules = target
      .filter((outputSpec) => !!outputSpec.styleRules?.length)
      .map((outputSpec) => outputSpec.styleRules!)
      .flat()

    const outputSpecToDOMList = target
      .filter((outputSpec) => !!outputSpec?.toDOM)
      .map((outputSpec) => outputSpec.toDOM!)

    const getRenderSpecAttrs = (mark: Mark, inline: boolean) => {
      if (!outputSpecToDOMList.length) return {}

      return outputSpecToDOMList.reduce((attrs, parse) => {
        return this.mergeAttributes(attrs, parse(mark, inline) ?? {})
      }, {} as Attrs)
    }

    const markSpecFields = Array.from(target).reduce(
      (fields, outputSpec) => {
        /* attrs */

        const attrs: Record<string, AttributeSpec> = {
          ...(spec?.attrs && spec.attrs),
          ...(fields?.attrs && fields.attrs),
          ...outputSpec.attrs,
        }

        /* parseDOM */

        const targetParseDOM = fields?.parseDOM ?? [
          ...(styleRules ?? []),
          ...(extensionMarkSpec.parseDOM ?? []),
        ]

        const parseDOM: ParseRule[] = targetParseDOM.map((rule: ParseRule) => {
          const getAttrs: NonNullable<TagParseRule['getAttrs'] | StyleParseRule['getAttrs']> = (
            dom: HTMLElement | string,
          ) => {
            const prevAttrs =
              typeof dom === 'string'
                ? (rule as StyleParseRule).getAttrs?.(dom)
                : (rule as TagParseRule).getAttrs?.(dom)

            const attrs =
              typeof dom === 'string'
                ? outputSpec.parseDOM?.(dom, (rule as StyleParseRule).style)
                : outputSpec.parseDOM?.(dom)

            if (prevAttrs === false) return false

            return {
              ...mergeNonNullableAttrs(prevAttrs),
              ...mergeNonNullableAttrs(attrs),
            }
          }

          return {
            ...rule,
            getAttrs,
          } as ParseRule
        })

        const toDOM = (mark: Mark, inline: boolean) => {
          return specToDOM!(mark, inline, getRenderSpecAttrs(mark, inline))
        }

        return {
          ...fields,
          ...(spec.parseDOM?.length && { parseDOM }),
          ...(specToDOM && { toDOM }),
          attrs,
        }
      },
      {} as Pick<MarkSpec, 'parseDOM' | 'toDOM' | 'attrs'>,
    )

    return {
      ...spec,
      ...markSpecFields,
    }
  }

  createNodeSpec({
    config,
    options,
  }: {
    config: NodeExtensionConfig<ExtensionConfigMap<any>, any>
    options: Record<any, any>
  }): NodeSpec {
    const { name, nodeSpec, extendProseMirrorBaseNodeSpec } = config

    if (extendProseMirrorBaseNodeSpec) {
      const baseNodeSpec = nodes[extendProseMirrorBaseNodeSpec.key]

      const baseExtensionNodeSpec: ExtensionNodeSpec = {
        ...baseNodeSpec,
        ...(baseNodeSpec?.toDOM && {
          toDOM(node) {
            return baseNodeSpec.toDOM!(node)
          },
        }),
      }

      return this.mergeDynamicNodeAttribute(name, {
        ...(extendProseMirrorBaseNodeSpec?.spec
          ? extendProseMirrorBaseNodeSpec.spec({
              baseNodeSpec,
              options,
            })
          : baseExtensionNodeSpec),
      })
    }

    return this.mergeDynamicNodeAttribute(name, nodeSpec!({ editor: this.editor, options }))
  }

  createMarkSpec({
    config,
    options,
  }: {
    config: MarkExtensionConfig<ExtensionConfigMap<any>, any>
    options: Record<any, any>
  }): MarkSpec {
    const { markSpec, name, extendProseMirrorBaseMarkSpec } = config

    if (extendProseMirrorBaseMarkSpec) {
      const baseMarkSpec = marks[extendProseMirrorBaseMarkSpec.key]

      return this.mergeDynamicMarkAttribute(name, {
        ...(extendProseMirrorBaseMarkSpec?.spec
          ? extendProseMirrorBaseMarkSpec.spec({ baseMarkSpec, options })
          : baseMarkSpec),
      })
    }

    return this.mergeDynamicMarkAttribute(name, markSpec!({ options }))
  }

  configure({ extension, schema = this.#schema }: { extension: AnyExtension; schema?: Schema }) {
    if (extension instanceof NodeExtension) {
      return this.configureNodeExtension({ extension, schema })
    }

    if (extension instanceof MarkExtension) {
      return this.configureMarkExtension({ extension, schema })
    }

    return this.configurePureExtension(extension)
  }

  configurePureExtension(extension: Extension<any, any>) {
    const editor = this.editor
    const options = extension.options

    if (extension.config.utils) {
      extension.configure('utils', { editor, options })
    }

    if (extension.config.commands) {
      extension.configure('commands', {
        editor,
        options,
        utils: extension.utils,
      })
    }

    if (extension.config.shortcut) {
      extension.configure('shortcut', {
        editor,
        commands: extension.commands,
        options,
        utils: extension.utils,
      })

      extension.keymapPlugin && this.#extensionPlugins.push(extension.keymapPlugin)
    }

    if (extension.config.plugins) {
      extension.configure('plugins', {
        editor,
        commands: extension.commands,
        shortcut: extension.shortcut,
        options,
        utils: extension.utils,
      })

      extension.plugins?.length && this.#extensionPlugins.push(...extension.plugins)
    }

    return extension
  }

  configureNodeExtension({
    extension,
    schema = this.#schema,
  }: {
    extension: NodeExtension<any, any>
    schema?: Schema
  }) {
    const editor = this.editor
    const types = this.getTypesFromSchema(schema)

    const options = extension.options

    let nodeType = schema.nodes[extension.name]

    if (!nodeType) {
      const schema = new Schema({
        nodes: {
          ...types.nodes,
          [extension.name]: this.createNodeSpec({ config: extension.config, options }),
        },
        marks: types.marks,
        topNode: this.#topNode,
      })

      nodeType = schema.nodes[extension.name]!
    }

    extension.nodeType = nodeType

    if (extension.config.utils) {
      extension.configure('utils', {
        editor,
        nodeType,
        options,
      })
    }

    if (extension.config.commands) {
      extension.configure('commands', {
        editor,
        nodeType,
        options,
        utils: extension.utils,
      })
    }

    if (extension.config.shortcut) {
      extension.configure('shortcut', {
        editor,
        nodeType,
        commands: extension.commands,
        options,
        utils: extension.utils,
      })

      extension.keymapPlugin && this.#extensionPlugins.push(extension.keymapPlugin)
    }

    if (extension.config.plugins) {
      extension.configure('plugins', {
        editor,
        nodeType,
        commands: extension.commands,
        shortcut: extension.shortcut,
        options,
        utils: extension.utils,
      })

      extension.plugins?.length && this.#extensionPlugins.push(...extension.plugins)
    }

    return extension
  }

  configureMarkExtension({
    extension,
    schema = this.#schema,
  }: {
    extension: MarkExtension<any, any>
    schema?: Schema
  }) {
    const editor = this.editor
    const types = this.getTypesFromSchema(schema)

    const options = extension.options

    let markType = schema.marks[extension.name]

    if (!markType) {
      const schema = new Schema({
        nodes: types.nodes,
        marks: {
          ...types.marks,
          [extension.name]: this.createMarkSpec({ config: extension.config, options }),
        },
        topNode: this.#topNode,
      })

      markType = schema.marks[extension.name]!
    }

    extension.markType = markType

    if (extension.config.utils) {
      extension.configure('utils', {
        editor,
        markType,
        options,
      })
    }

    if (extension.config.commands) {
      extension.configure('commands', {
        editor,
        markType,
        options,
        utils: extension.utils,
      })
    }

    if (extension.config.shortcut) {
      extension.configure('shortcut', {
        editor,
        markType,
        commands: extension.commands,
        options,
        utils: extension.utils,
      })

      extension.keymapPlugin && this.#extensionPlugins.push(extension.keymapPlugin)
    }

    if (extension.config.plugins) {
      extension.configure('plugins', {
        editor,
        markType,
        commands: extension.commands,
        shortcut: extension.shortcut,
        options,
        utils: extension.utils,
      })

      extension.plugins?.length && this.#extensionPlugins.push(...extension.plugins)
    }

    return extension
  }

  getTypesFromSchema(schema: Schema) {
    return {
      nodes: {
        ...schema.spec.nodes.toObject(),
      },
      marks: {
        ...schema.spec.marks.toObject(),
      },
    }
  }

  createSchema = (extensions: AnyExtension[]) => {
    // let topNode: string | undefined

    let nodeSpecs: {
      [key: string]: NodeSpec
    } = {}

    let markSpecs: {
      [key: string]: MarkSpec
    } = {}

    const sortedExtensions = extensions.toSorted((a, b) => b.priority - a.priority)

    for (const extension of sortedExtensions) {
      if (extension instanceof NodeExtension) {
        // create nodeSpec from node extension config

        const { topNode: isTopNode } = extension.config

        const nodeSpec = this.createNodeSpec({
          config: extension.config,
          options: extension.options,
        })

        if (isTopNode) {
          this.#topNode = extension.name
        }

        nodeSpecs = {
          ...nodeSpecs,
          [extension.name]: nodeSpec,
        }
      }

      if (extension instanceof MarkExtension) {
        // create markSpec from mark extension config

        markSpecs = {
          ...markSpecs,
          [extension.name]: this.createMarkSpec({
            config: extension.config,
            options: extension.options,
          }),
        }

        continue
      }

      // Do nothing if it's a base extension (Extension)
    }

    return new Schema({ nodes: nodeSpecs, marks: markSpecs, topNode: this.#topNode })
  }

  createExtensionPlugins = ({
    extensions,
    schema = this.#schema,
  }: {
    extensions: AnyExtension[]
    schema?: Schema
  }) => {
    const extensionPlugins: Plugin[] = []

    const sortedExtensions = extensions.toSorted((a, b) => b.priority - a.priority)

    for (const extension of sortedExtensions) {
      let extendedFromExtension = extension.extendedFrom

      while (extendedFromExtension) {
        this.configure({ extension: extendedFromExtension, schema })

        extendedFromExtension = extendedFromExtension.extendedFrom
      }

      this.configure({ extension, schema })
    }

    return extensionPlugins
  }

  combinePlugins = ({ plugins }: { plugins?: Plugin[] } = {}) => {
    const extensionPlugins = this.#extensionPlugins

    if (plugins?.length) {
      return unionWith(
        extensionPlugins.length ? plugins.concat(extensionPlugins) : plugins,
        (a, b) => a.spec.key === b.spec.key,
      )
    }

    return unionWith(extensionPlugins, (a, b) => a.spec.key === b.spec.key)
  }

  integratePlugins = ({ plugins }: { plugins?: Plugin[] } = {}) => {
    return {
      schema: this.#schema,
      editorPlugins: this.combinePlugins({ plugins }),
    }
  }
}
