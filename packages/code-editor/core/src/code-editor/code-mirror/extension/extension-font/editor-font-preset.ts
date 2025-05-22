import { editorFont } from './editor-font-plugin'
import { FontFaceBuilder } from './editor-font/font-face'

export const editorFontPreset = () => {
  const codeFont = editorFont('monospace')
    .fetch({
      fontName: 'JetBrains Mono',
      links: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: '""',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap',
        },
      ],
    })
    .fetch({
      fontName: 'D2Coding',
      links: [
        new FontFaceBuilder()
          // prettier-ignore
          .family('D2Coding')
          .source(
            `url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_three@1.0/D2Coding.woff') format('woff')`,
          )
          .descriptors({
            weight: 'normal',
            style: 'normal',
          })
          .build(),
      ],
    })
    .applyFont(['JetBrains Mono'], {
      selectors: ['.cm-content', '.cm-gutters'],
      style: {
        fontFeatureSettings: '"calt" 0',
      },
    })
    .applyFont(['D2Coding'], {
      selectors: ['.cm-content'],
    })
    .plugin()

  const tagFont = editorFont('monospace')
    .fetch({
      fontName: 'IBM Plex Mono',
      links: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: '""',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
        },
      ],
    })
    .plugin()

  return [codeFont, tagFont]
}
