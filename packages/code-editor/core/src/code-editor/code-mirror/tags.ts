import { Tag, tags } from '@lezer/highlight'

const jsTags = {
  variable: {
    inArgList: Tag.define(),
    inArray: Tag.define(),
    moduleIdentifier: Tag.define(),
    name: Tag.define(),
    functionName: Tag.define(),
    objectIdentifier: Tag.define(),
    memberProperty: Tag.define(),
    fieldDeclaration: Tag.define(),
    propertyName: Tag.define(),
    propertyType: Tag.define(),
  },
  keyword: {
    new: Tag.define(),
    'keyof/typeof': Tag.define(),
  },
  jsxText: Tag.define(),
  tagAngleBracket: Tag.define(),
  colon: Tag.define(),
  spread: Tag.define(),
}

export const highlightTags = {
  ...tags,
  language: {
    js: {
      ...jsTags,
    },
  },
}
