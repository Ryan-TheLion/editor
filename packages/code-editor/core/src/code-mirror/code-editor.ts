import { Compartment, EditorState, Extension, StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { minimalSetup } from 'codemirror'

import { darkTheme, lightTheme } from '../theme'
import { CommandManager } from './commands'
import {
  CODE_EDITOR_DEFAULT_LANGUAGE,
  CodeEditorLanguages,
  type CodeEditorSupportedLanguage,
  type EditorLanguagePack,
} from './languages'

type CodeEditorTheme = 'light' | 'dark' | Extension

export class CodeEditor {
  state: EditorState
  view: EditorView
  dom: HTMLElement

  #themeCompartment: Compartment
  theme: CodeEditorTheme

  #languageCompartment: Compartment
  editorLanguages: EditorLanguagePack

  util: CodeEditorUtil
  commandManager: CommandManager

  constructor({
    state,
    view,
    dom,
    content,
    extraExtensions = [],
    theme = 'light',
  }: {
    state?: EditorState
    view?: EditorView
    dom?: HTMLElement
    content?: string
    theme?: CodeEditorTheme
    extraExtensions?: Extension[]
  } = {}) {
    this.util = new CodeEditorUtil({ editor: this })

    this.editorLanguages = { ...CodeEditorLanguages }
    this.#languageCompartment = new Compartment()

    const defaultLanguage = this.#languageCompartment.of(
      this.editorLanguages[CODE_EDITOR_DEFAULT_LANGUAGE],
    )

    this.#themeCompartment = new Compartment()
    this.theme = theme
    const defaultTheme = this.#themeCompartment.of(this.util.getThemeExtension(this.theme))

    this.state =
      state ??
      EditorState.create({
        doc: content ?? '',
        extensions: [
          minimalSetup,
          EditorView.lineWrapping,
          defaultLanguage,
          defaultTheme,
          ...extraExtensions,
        ],
      })

    this.view =
      view ??
      new EditorView({
        state: this.state,
        parent: dom ?? undefined,
      })

    this.dom = dom ?? this.view.dom

    this.commandManager = new CommandManager({ editor: this })
  }

  attachDom<DomElement extends HTMLElement>(targetDom: DomElement) {
    if (this.dom.parentElement === targetDom) return

    targetDom.append(this.dom)
  }

  changeLanguage(language: CodeEditorSupportedLanguage) {
    this.view.dispatch({
      effects: this.#languageCompartment.reconfigure(this.editorLanguages[language]),
    })
  }

  addExtension(extension: Extension) {
    this.view.dispatch({
      effects: StateEffect.appendConfig.of(extension),
    })
  }

  setExtensions(extraExtensions: Extension[]) {
    const extensions = [minimalSetup, extraExtensions]

    this.view.dispatch({
      effects: StateEffect.reconfigure.of(extensions),
    })
  }

  changeTheme(theme: CodeEditorTheme) {
    const targetTheme = this.util.getThemeExtension(theme)

    if (this.#themeCompartment.get(this.view.state) == targetTheme) return

    this.theme = theme

    this.view.dispatch({
      effects: this.#themeCompartment.reconfigure(targetTheme),
    })
  }
}

class CodeEditorUtil {
  editor: CodeEditor

  constructor({ editor }: { editor: CodeEditor }) {
    this.editor = editor
  }

  getThemeExtension(theme: CodeEditorTheme) {
    if (theme === 'light') return lightTheme
    if (theme === 'dark') return darkTheme

    return theme
  }
}
