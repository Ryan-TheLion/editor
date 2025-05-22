export type GenericFontFamily =
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'fantasy'
  | 'system-ui'
  | 'ui-serif'
  | 'ui-sans-serif'
  | 'ui-monospace'
  | 'ui-rounded'
  | 'math'
  | 'emoji'
  | 'fangsong'

type LinkCrossOrigin = '""' | 'anonymous' | 'use-credentials'

export type FontLinkParam = {
  rel: HTMLLinkElement['rel']
  href: HTMLLinkElement['href']
  crossOrigin?: LinkCrossOrigin
}

type FontFaceParam = {
  family: string
  source: string | BufferSource
  descriptors?: FontFaceDescriptors
}

export type EditorFontFaceSet<FontName extends string = string> = {
  fontName: FontName
  links: (FontLinkParam | FontFace)[]
}

export const genericFontFamilies: GenericFontFamily[] = [
  'cursive',
  'emoji',
  'fangsong',
  'fantasy',
  'math',
  'monospace',
  'sans-serif',
  'serif',
  'system-ui',
  'ui-monospace',
  'ui-rounded',
  'ui-sans-serif',
  'ui-serif',
]

export class FontFaceBuilder {
  #fontFaceParam: FontFaceParam

  constructor() {
    this.#fontFaceParam = {
      family: '',
      source: '',
      descriptors: undefined,
    }
  }

  family = (family: string) => {
    this.#fontFaceParam.family = family

    return {
      source: this.source,
      descriptors: this.descriptors,
      build: this.build,
    }
  }

  source = (source: string | BufferSource) => {
    this.#fontFaceParam.source = source

    return {
      family: this.family,
      descriptors: this.descriptors,
      build: this.build,
    }
  }

  descriptors = (descriptors: FontFaceDescriptors) => {
    this.#fontFaceParam.descriptors = descriptors

    return {
      family: this.family,
      source: this.source,
      build: this.build,
    }
  }

  build = () => {
    if (typeof window !== 'undefined' && 'FontFace' in window) {
      const { family, source, descriptors } = this.#fontFaceParam

      if (!family || !source) {
        throw new Error('fontface 의 family, source는 필수 속성입니다')
      }

      return new FontFace(family, source, descriptors)
    }

    return null as unknown as FontFace
  }
}
