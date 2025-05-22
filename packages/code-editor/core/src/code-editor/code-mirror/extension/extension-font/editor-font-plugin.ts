import { EditorView, PluginValue, ViewPlugin } from '@codemirror/view'
import { parseArrayFromFontsValueIterator, styleMapToText, styleTextToMap } from '../../../../utils'
import {
  EditorFontFaceSet,
  EditorFontMap,
  EditorFonts,
  FontLinkParam,
  FontStatus,
  genericFontFamilies,
  GenericFontFamily,
} from './editor-font'

export interface EditorFontPluginValue extends PluginValue {
  fetchFont: () => void
  onFontLoaded: (e: FontFaceSetLoadEvent) => void
}

type ReturnFetchFont<FontNames extends string[] = []> = {
  fetch: <FontName extends string>(
    param: EditorFontFaceSet<FontName>,
  ) => ReturnFetchFont<[...FontNames, FontName]>
  applyFont: ApplyEditorFont<FontNames>
  plugin: CreateFontPlugin
}

type ApplyFontParams<FontNames extends string[] = string[]> = [
  FontNames[number][],
  {
    selectors: string[]
    style?: Record<string, string | number>
  },
]

type ApplyEditorFont<FontNames extends string[] = []> = (...params: ApplyFontParams<FontNames>) => {
  applyFont: ApplyEditorFont<FontNames>
  plugin: CreateFontPlugin
}

type CreateFontPlugin = () => ViewPlugin<EditorFontPluginValue>

interface EditorFontPluginConfig {
  view: EditorView
  genericFontFamily: GenericFontFamily
  props: {
    fontMap: EditorFontMap
    applyFontParams?: {
      fontNames: string[]
      selectors: string[]
      style?: Record<string, string | number>
    }[]
  }
}

export const editorFont = <G extends GenericFontFamily, FontNames extends string[] = []>(
  genericFontFamily: G,
) => {
  const fontMap: EditorFontMap = new EditorFontMap()

  const applyFontParams: NonNullable<EditorFontPluginConfig['props']['applyFontParams']> = []

  const fetch = <Name extends string = string>({
    fontName,
    links,
  }: {
    fontName: Name
    links: EditorFontFaceSet['links']
  }) => {
    fontMap.set(fontName, { links, status: 'idle' })

    return {
      fetch,
      plugin,
      applyFont,
    } as unknown as ReturnFetchFont<[...FontNames, Name]>
  }

  const applyFont = (...params: ApplyFontParams<FontNames>) => {
    applyFontParams.push({
      fontNames: params[0],
      ...params[1],
    })

    return {
      applyFont,
      plugin,
    } as ReturnType<ApplyEditorFont<FontNames>>
  }

  const plugin: CreateFontPlugin = () => {
    return ViewPlugin.define(
      (view) =>
        new EditorFontPlugin({
          view,
          genericFontFamily,
          props: {
            fontMap,
            applyFontParams,
          },
        }),
    )
  }

  return {
    fetch,
  }
}

export class EditorFontPlugin implements EditorFontPluginValue {
  #fontMap: EditorFontMap
  #genericFontFamily: GenericFontFamily

  #applyFontParams: NonNullable<EditorFontPluginConfig['props']['applyFontParams']> = []

  #view: EditorView

  #mutationObserver: MutationObserver | null = null

  private static fontMap: EditorFontMap = new EditorFontMap()

  static fonts = new EditorFonts(EditorFontPlugin.fontMap)

  constructor({ view, genericFontFamily, props }: EditorFontPluginConfig) {
    this.#view = view

    this.#fontMap = props.fontMap
    this.#fontMap.forEachMap(({ fontName, links, status }) => {
      EditorFontPlugin.fontMap.set(fontName, { links, status })
    })

    this.#genericFontFamily = genericFontFamily

    if (props.applyFontParams) {
      this.#applyFontParams = props.applyFontParams

      this.#mutationObserver = new MutationObserver(([mutation]) => {
        if (!mutation) return

        const { addedNodes } = mutation
        if (!addedNodes.length) return

        const applyTargetParams = this.getTargetApplyParams(Array.from(addedNodes))
        if (!applyTargetParams.length) return

        this.applyFont(applyTargetParams)
      })

      this.#mutationObserver.observe(this.#view.dom, {
        childList: true,
        subtree: true,
      })
    }

    document.fonts.addEventListener('loadingdone', this.onFontLoaded)

    document.fonts.ready.then(() => {
      this.#fontMap.forEachMap(({ fontName }) => {
        hasFont(fontName) && this.setFontStatus(fontName, 'done')
      })
    })

    this.fetchFont()
  }

  destroy(): void {
    document.fonts.removeEventListener('loadingdone', this.onFontLoaded)

    this.#mutationObserver?.disconnect()
    this.#mutationObserver = null
  }

  getTargetApplyParams = (addedNodes: Node[]) => {
    if (!this.#applyFontParams.length) return []

    const addedElements = addedNodes as HTMLElement[]

    if (!addedElements.length) return []

    const addedElementsClassNameSet = new Set<string>(
      Array.from(
        addedElements
          .filter((element) => 'classList' in element)
          .flatMap((element) => Array.from(element.classList.values())),
      ),
    )

    const addedElementsIdSet = new Set<string>(addedElements.map((element) => element.id))

    return this.#applyFontParams
      .map((param) => {
        const targetSelectors = param.selectors.filter((selector) => {
          if (selector.startsWith('.')) {
            // class selector
            return addedElementsClassNameSet.has(selector.replace(/^\./, ''))
          }

          if (selector.startsWith('#')) {
            // id selector
            return addedElementsIdSet.has(selector.replace(/^#/, ''))
          }

          return false
        })

        if (!targetSelectors.length) return null

        return {
          ...param,
          selectors: targetSelectors,
        }
      })
      .filter((p) => !!p)
  }

  setFontStatus = (fontName: string, status: FontStatus) => {
    this.#fontMap.setFontStatus(fontName, status)
    EditorFontPlugin.fontMap.setFontStatus(fontName, status)
  }

  fetchFont() {
    const fragment = document.createDocumentFragment()

    const fontFaces: FontFace[] = []

    this.#fontMap.forEachMap(({ fontName, links }) => {
      const fontElements = links
        .filter((link) => {
          if ('href' in link) {
            const selector = (() => {
              let linkSelector = `link[rel="${link.rel}"][href="${link.href}"]`

              if (link.crossOrigin != null) {
                if (link.crossOrigin === '""') {
                  linkSelector += `[crossorigin=""]`

                  return linkSelector
                }

                linkSelector += `[crossorigin=${link.crossOrigin}]`
              }

              return linkSelector
            })()

            return !document.querySelector(selector)
          }

          fontFaces.push(link)

          return false
        })
        .map((link) => {
          const linkElement = document.createElement('link')

          const { rel, href, crossOrigin } = link as FontLinkParam

          linkElement.rel = rel
          linkElement.href = href
          if (crossOrigin != null) {
            linkElement.setAttribute('crossorigin', crossOrigin === '""' ? '' : crossOrigin)
          }

          return linkElement
        })

      if (!fontElements.length) return

      fragment.append(...fontElements)
      this.setFontStatus(fontName, 'loading')
    })

    if (fragment.hasChildNodes()) {
      document.head.append(fragment)
    }

    const targetFontFaces = fontFaces.filter((fontFace) => !!fontFace && !hasFont(fontFace.family))

    if (targetFontFaces.length) {
      targetFontFaces.forEach((fontFace) => {
        this.setFontStatus(fontFace.family, 'loading')

        fontFace.load().then(() => {
          document.fonts.add(fontFace)
        })
      })
    }

    if (!this.#applyFontParams) return

    queueMicrotask(() => {
      this.applyFont(this.#applyFontParams!)
    })
  }

  onFontLoaded = (e: FontFaceSetLoadEvent) => {
    this.#fontMap.forEachMap(({ fontName }) => {
      hasFont(fontName) && this.setFontStatus(fontName, 'done')
    })
  }

  applyFont = (
    applyFontParams: NonNullable<EditorFontPluginConfig['props']['applyFontParams']>,
  ) => {
    const mergeStyle = ({
      dom,
      fontNames,
      genericFontFamily,
      style,
    }: {
      dom: HTMLElement
      fontNames: string[]
      genericFontFamily: GenericFontFamily
      style?: Record<string, string | number>
    }) => {
      const mergeFontFamilyFormat = (fontNames: string[]) => {
        const currentFontFamily = getComputedStyle(dom)
          .fontFamily.replaceAll(new RegExp(genericFontFamilies.join('|'), 'g'), '')
          .split(', ')
          .filter((v) => !!v)

        const fontFamily = [
          ...currentFontFamily,
          ...fontNames.filter((fontName) => !currentFontFamily.includes(fontName)),
          genericFontFamily,
        ].join(', ')

        return fontFamily
      }

      const styleMap = {
        ...styleTextToMap(dom.style.cssText),
        ...style,
        fontFamily: mergeFontFamilyFormat(fontNames.map((fontName) => `"${fontName}"`)),
      }

      const cssText = styleMapToText(styleMap)

      dom.style.cssText = cssText
    }

    const apply = ({ fontNames, selectors, style }: (typeof applyFontParams)[number]) => {
      selectors.forEach((selector) => {
        const dom = this.#view.dom.querySelector<HTMLElement>(selector)

        if (!dom) return

        mergeStyle({
          dom,
          fontNames,
          genericFontFamily: this.#genericFontFamily,
          style,
        })
      })
    }

    applyFontParams.forEach((applyFontParam) => {
      apply(applyFontParam)
    })
  }
}

export const hasFont = (fontName: string): boolean => {
  /*
    - firefox에서는 Array.from(document.fonts.values()) 로 이터레이터 변환을 할 수 없음
      - 변환 시 [] 빈 배열이고, for ... of 로 할 경우 not iterable 에러 발생
      - 직접 이터레이터를 순회해서 fonts를 반환하는 유틸함수를 구현하여 fonts의 values 참조
  */
  const documentFonts = parseArrayFromFontsValueIterator(document.fonts.values())

  return documentFonts.some((font) => sameFontName({ fontFamilyName: font.family, fontName }))
}

// font plugin에서 font이름은 "" 를 포함하지 않는 문자열
// document.fonts에서 family는 '"JetBrains Mono"' 처럼 공백 등이 있을 경우 "" 가 포함된 문자열이 될 수 있음
const sameFontName = ({
  fontFamilyName,
  fontName,
}: {
  fontFamilyName: string
  fontName: string
}) => {
  if (fontFamilyName.startsWith(`"`)) {
    return fontFamilyName === `"${fontName}"`
  }

  return fontFamilyName === fontName
}
