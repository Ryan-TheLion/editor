import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

import { EventManager } from '../../event-manager'
import { codeEditorDarkThemeColors, codeEditorLightThemeColors } from '../../theme/colors'
import { prettierCommand, prettierKeymap } from './command'

interface PrettierCodeOptions {
  toolbar?: boolean
  keyBinding?: boolean
}

export const prettierCode = ({ toolbar = true, keyBinding = true }: PrettierCodeOptions = {}) => {
  if (!toolbar) {
    return Array.from(
      Object.values({
        ...(keyBinding && {
          prettierKeymap,
        }),
      }),
    )
  }

  class PrettierToolbar extends HTMLDivElement {
    #prettierButton: HTMLButtonElement

    static PrettierIconSvgStringFormat = `<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M8.571 23.429A.571.571 0 0 1 8 24H2.286a.571.571 0 0 1 0-1.143H8c.316 0 .571.256.571.572zM8 20.57H6.857a.571.571 0 0 0 0 1.143H8a.571.571 0 0 0 0-1.143zm-5.714 1.143H4.57a.571.571 0 0 0 0-1.143H2.286a.571.571 0 0 0 0 1.143zM8 18.286H2.286a.571.571 0 0 0 0 1.143H8a.571.571 0 0 0 0-1.143zM16 16H5.714a.571.571 0 0 0 0 1.143H16A.571.571 0 0 0 16 16zM2.286 17.143h1.143a.571.571 0 0 0 0-1.143H2.286a.571.571 0 0 0 0 1.143zm17.143-3.429H16a.571.571 0 0 0 0 1.143h3.429a.571.571 0 0 0 0-1.143zM9.143 14.857h4.571a.571.571 0 0 0 0-1.143H9.143a.571.571 0 0 0 0 1.143zm-6.857 0h4.571a.571.571 0 0 0 0-1.143H2.286a.571.571 0 0 0 0 1.143zM20.57 11.43h-9.14a.571.571 0 0 0 0 1.142h9.142a.571.571 0 0 0 0-1.142zM9.714 12a.571.571 0 0 0-.571-.571H5.714a.571.571 0 0 0 0 1.142h3.429A.571.571 0 0 0 9.714 12zm-7.428.571h1.143a.571.571 0 0 0 0-1.142H2.286a.571.571 0 0 0 0 1.142zm19.428-3.428H16a.571.571 0 0 0 0 1.143h5.714a.571.571 0 0 0 0-1.143zM2.286 10.286H8a.571.571 0 0 0 0-1.143H2.286a.571.571 0 0 0 0 1.143zm13.143-2.857A.57.57 0 0 0 16 8h5.714a.571.571 0 0 0 0-1.143H16a.571.571 0 0 0-.571.572zm-8.572-.572a.571.571 0 0 0 0 1.143H8a.571.571 0 0 0 0-1.143H6.857zM2.286 8H4.57a.571.571 0 0 0 0-1.143H2.286a.571.571 0 0 0 0 1.143zm16.571-2.857c0 .315.256.571.572.571h1.142a.571.571 0 0 0 0-1.143H19.43a.571.571 0 0 0-.572.572zm-1.143 0a.571.571 0 0 0-.571-.572H12.57a.571.571 0 0 0 0 1.143h4.572a.571.571 0 0 0 .571-.571zm-15.428.571h8a.571.571 0 0 0 0-1.143h-8a.571.571 0 0 0 0 1.143zm5.143-2.857c0 .316.255.572.571.572h11.429a.571.571 0 0 0 0-1.143H8a.571.571 0 0 0-.571.571zm-5.143.572h3.428a.571.571 0 0 0 0-1.143H2.286a.571.571 0 0 0 0 1.143zm0-2.286H16A.571.571 0 0 0 16 0H2.286a.571.571 0 0 0 0 1.143z'/></svg>`

    constructor() {
      super()

      const prettierButton = document.createElement('button')

      const parser = new DOMParser()
      const doc = parser.parseFromString(
        PrettierToolbar.PrettierIconSvgStringFormat,
        'image/svg+xml',
      )

      const icon = doc.documentElement
      icon.dataset.toolType = 'prettier'

      prettierButton.append(icon)

      this.#prettierButton = prettierButton

      const shadowRoot = this.attachShadow({ mode: 'open' })

      shadowRoot.innerHTML = `
          <style>
            * {
              -webkit-tap-highlight-color:rgba(255,255,255,0);
            }

            :host {
              position: absolute;
              top: 0;
              right: 42px;
              margin: 4px !important;
            }

            button {
              appearance: none;
              background: ${codeEditorLightThemeColors.editor.bg};
              border: 0;
              display: inline-flex;
              justify-content: center;
              align-items: center;
              padding: 4px;
              cursor: pointer;
              transition: background 0.2s;
              border-radius: 4px;
            }

            :host(.dark) button {
              background: ${codeEditorDarkThemeColors.editor.bg};
            }

            svg[data-tool-type="prettier"] {
              transition: fill 0.2s;
              width: 20px;
              height: 20px;
            }

            svg[data-tool-type="prettier"] path {
              fill: #808080;
            }

            @media (hover: hover) and (pointer: fine) {
              button:hover {
                background: #e3dddd;
              }

              :host(.dark) button:hover {
                background: #eeeeee;
              }

              button:hover svg[data-tool-type="prettier"] path {
                fill: #000;
              }
            }
          </style>
        `

      shadowRoot.append(prettierButton)
    }

    get prettierButton() {
      return this.#prettierButton
    }
  }

  window.customElements.define('cm-prettier-tool', PrettierToolbar, { extends: 'div' })

  return ViewPlugin.fromClass(
    class {
      #toolbar: PrettierToolbar
      #buttonEventManager: EventManager<HTMLButtonElement>

      constructor(view: EditorView) {
        this.#toolbar = document.createElement('div', {
          is: 'cm-prettier-tool',
        }) as PrettierToolbar

        this.#buttonEventManager = new EventManager(this.#toolbar.prettierButton)
        this.#buttonEventManager.addEventHandler('click', () => {
          prettierCommand(view)
        })

        view.dom.append(this.#toolbar)
      }

      update(update: ViewUpdate) {
        const isDarkTheme = update.view.state.facet(EditorView.darkTheme)
        this.#toolbar.shadowRoot?.host.classList.toggle('dark', isDarkTheme)
      }

      destroy() {
        this.#buttonEventManager.removeAllEventHandler()
      }
    },
    {
      provide: () =>
        Array.from(
          Object.values({
            toolbarArea: EditorView.contentAttributes.of({ style: 'padding-top: 40px' }),
            ...(keyBinding && {
              prettierKeymap,
            }),
          }),
        ),
    },
  )
}
