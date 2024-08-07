import { EditorView, ViewPlugin } from '@codemirror/view'

export const firaCodeFont = () =>
  ViewPlugin.fromClass(FiraCodeFontPlugin, {
    provide: () =>
      EditorView.contentAttributes.of({
        style: `font-family: 'Fira Code', monospace; font-optical-sizing: auto;`,
      }),
  })

class FiraCodeFontPlugin {
  static status: 'idle' | 'loding' | 'loadingDone' = 'idle'

  static hasFiraCodeFont = () =>
    Array.from(document.fonts.values()).some((font) => font.family === 'Fira Code')

  static onFontLoadingDone = () => {
    if (FiraCodeFontPlugin.hasFiraCodeFont()) {
      FiraCodeFontPlugin.status = 'loadingDone'
    }
  }

  constructor() {
    const hasFiraCodeFont = FiraCodeFontPlugin.hasFiraCodeFont()

    if (hasFiraCodeFont) {
      FiraCodeFontPlugin.status = 'loadingDone'
      return
    }

    if (FiraCodeFontPlugin.status === 'idle') {
      document.fonts.addEventListener('loadingdone', FiraCodeFontPlugin.onFontLoadingDone)
    }

    if (FiraCodeFontPlugin.status !== 'idle') return

    FiraCodeFontPlugin.status = 'loding'

    this.fetchFiraCodeFont()
  }

  destroy() {
    document.fonts.removeEventListener('loadingdone', FiraCodeFontPlugin.onFontLoadingDone)
  }

  fetchFiraCodeFont() {
    const fragment = document.createDocumentFragment()

    const preconnectFontsGoogleApi = document.createElement('link')
    preconnectFontsGoogleApi.rel = 'preconnect'
    preconnectFontsGoogleApi.href = 'https://fonts.googleapis.com'

    const preconnectFontsGstatic = document.createElement('link')
    preconnectFontsGstatic.rel = 'preconnect'
    preconnectFontsGstatic.href = 'https://fonts.gstatic.com'
    preconnectFontsGstatic.crossOrigin = 'anonymous'

    const firacodeCss = document.createElement('link')
    firacodeCss.rel = 'stylesheet'
    firacodeCss.href =
      'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap'

    fragment.append(preconnectFontsGoogleApi, preconnectFontsGstatic, firacodeCss)

    document.head.appendChild(fragment)
  }
}
