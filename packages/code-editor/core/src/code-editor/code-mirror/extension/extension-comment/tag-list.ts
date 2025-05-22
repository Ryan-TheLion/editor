export const JS_DOC_TAGS = {
  block: [
    'abstract',
    'virtual',
    'access',
    'alias',
    'async',
    'augments',
    'extends',
    'author',
    'borrows',
    'class',
    'constructor',
    'classdesc',
    'constant',
    'const',
    'constructs',
    'copyright',
    'default',
    'defaultValue',
    'deprecated',
    'description',
    'desc',
    'enum',
    'event',
    'example',
    'exports',
    'external',
    'host',
    'file',
    'fileoverview',
    'overview',
    'fires',
    'emits',
    'function',
    'func',
    'method',
    'generator',
    'global',
    'hideconstructor',
    'ignore',
    'implements',
    'inheritdoc',
    'inner',
    'instance',
    'interface',
    'kind',
    'lends',
    'license',
    'listens',
    'member',
    'var',
    'memberof',
    'mixes',
    'mixin',
    'module',
    'name',
    'namespace',
    'override',
    'package',
    'param',
    'arg',
    'argList',
    'private',
    'property',
    'prop',
    'protected',
    'public',
    'readonly',
    'requires',
    'returns',
    'return',
    'see',
    'since',
    'static',
    'summary',
    'this',
    'throws',
    'exception',
    'todo',
    'tutorial',
    'type',
    'typedef',
    'variation',
    'version',
    'yields',
    'yield',
  ],
  inline: ['link', 'linkcode', 'linkplain', 'tutorial'],
}

export const TS_DOC_TAGS = {
  block: [
    'alpha',
    'beta',
    'decorator',
    'deprecated',
    'defaultValue',
    'eventProperty',
    'example',
    'experimental',
    'internal',
    'override',
    'packageDocumentation',
    'param',
    'privateRemarks',
    'public',
    'readonly',
    'remarks',
    'returns',
    'sealed',
    'see',
    'throws',
    'typeParam',
    'virtual',
  ],
  inline: ['inheritDoc', 'label', 'link'],
}

const TAGS = {
  block: Array.from(new Set([...JS_DOC_TAGS.block, ...TS_DOC_TAGS.block])),
  inline: Array.from(new Set([...JS_DOC_TAGS.inline, ...TS_DOC_TAGS.inline])),
}

const jsDocTagList = {
  block: TAGS.block.join('|'),
  inline: TAGS.inline.join('|'),
}

const jsDocTagRegex = new RegExp(
  `(?<blockTag>@(?:${jsDocTagList.block})\\b)|(?:(?<={)(?<inlineTag>@(?:${jsDocTagList.inline})\\b)(?:\\s+[^}]*)?})`,
  'gm',
)

export const getMatchedDocTag = (comment: string, startIndex?: number) => {
  const tags: Array<{
    type: 'atSymbol' | 'tagName'
    tag: string
    from: number
    to: number
  }> = []

  let match

  while ((match = jsDocTagRegex.exec(comment)) !== null) {
    const groups = match.groups!

    if (groups.blockTag) {
      tags.push(
        {
          type: 'atSymbol',
          tag: groups.blockTag.substring(0, 1),
          from: (startIndex ?? 0) + match.index,
          to: (startIndex ?? 0) + match.index + 1,
        },
        {
          type: 'tagName',
          tag: groups.blockTag.substring(1),
          from: (startIndex ?? 0) + match.index + 1,
          to: (startIndex ?? 0) + match.index + groups.blockTag.length,
        },
      )

      continue
    }

    if (groups.inlineTag) {
      tags.push(
        {
          type: 'atSymbol',
          tag: groups.inlineTag.substring(0, 1),
          from: (startIndex ?? 0) + match.index,
          to: (startIndex ?? 0) + match.index + 1,
        },
        {
          type: 'tagName',
          tag: groups.inlineTag.substring(1),
          from: (startIndex ?? 0) + match.index + 1,
          to: (startIndex ?? 0) + match.index + groups.inlineTag.length,
        },
      )

      continue
    }
  }

  return tags
}
