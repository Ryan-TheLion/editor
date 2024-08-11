import { Compartment, EditorState, Extension, StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { minimalSetup } from 'codemirror'

import { viewActiveLine } from '../extension'
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

  autoFocus: boolean

  #themeCompartment: Compartment
  theme: CodeEditorTheme

  #languageCompartment: Compartment
  editorLanguages: EditorLanguagePack

  #editableCompartment: Compartment

  util: CodeEditorUtil
  commandManager: CommandManager

  constructor({
    state,
    view,
    dom,
    content,
    theme = 'light',
    editable = true,
    language = CODE_EDITOR_DEFAULT_LANGUAGE,
    autoFocus = false,
    extraExtensions = [],
  }: {
    state?: EditorState
    view?: EditorView
    dom?: HTMLElement
    content?: string
    theme?: CodeEditorTheme
    editable?: boolean
    language?: CodeEditorSupportedLanguage
    autoFocus?: boolean
    extraExtensions?: Extension[]
  } = {}) {
    this.#themeCompartment = new Compartment()
    this.#editableCompartment = new Compartment()
    this.#languageCompartment = new Compartment()

    this.theme = theme
    this.editorLanguages = { ...CodeEditorLanguages }

    this.autoFocus = autoFocus

    this.util = new CodeEditorUtil({ editor: this })

    this.state =
      state ??
      EditorState.create({
        doc: content ?? '',
      })

    this.view =
      view ??
      new EditorView({
        state: this.state,
        parent: dom ?? undefined,
      })

    this.addExtension([
      ...this.util.getBaseExtension({ editable, theme, language }),
      ...extraExtensions,
    ])

    this.dom = this.view.dom

    if (this.autoFocus) this.view.focus()

    this.commandManager = new CommandManager({ editor: this })
  }

  get editable() {
    return this.view.state.facet(EditorView.editable.reader)
  }

  get compartments() {
    return {
      editable: this.#editableCompartment,
      theme: this.#themeCompartment,
      language: this.#languageCompartment,
    }
  }

  attachDom<DomElement extends HTMLElement>(targetDom: DomElement) {
    if (this.dom.parentElement === targetDom) return

    targetDom.append(this.dom)

    if (this.autoFocus) this.view.focus()
  }

  changeLanguage(language: CodeEditorSupportedLanguage) {
    this.view.dispatch({
      effects: this.#languageCompartment.reconfigure(this.editorLanguages[language]),
    })
  }

  addExtension(extension: Extension[]) {
    this.view.dispatch({
      effects: StateEffect.appendConfig.of([...extension]),
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

  setEditable(
    editable: boolean,
    { autoFocusOnEditable = true }: { autoFocusOnEditable?: boolean } = {},
  ) {
    if (this.editable === editable) return

    this.view.dispatch({
      effects: this.#editableCompartment.reconfigure(EditorView.editable.of(editable)),
    })

    if (this.editable && autoFocusOnEditable) {
      this.view.focus()
    }
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

  getBaseExtension({
    editable,
    theme,
    language,
  }: {
    editable: boolean
    theme: CodeEditorTheme
    language: CodeEditorSupportedLanguage
  }) {
    const state = this.editor.view.state

    const {
      editable: editableCompartment,
      theme: themeCompartment,
      language: languageCompartment,
    } = this.editor.compartments

    const editableExtension =
      editableCompartment.get(state) ?? editableCompartment.of(EditorView.editable.of(editable))

    const themeExtension =
      themeCompartment.get(state) ?? themeCompartment.of(this.getThemeExtension(theme))

    const languageExtension =
      languageCompartment.get(state) ??
      languageCompartment.of(this.editor.editorLanguages[language])

    return [minimalSetup, editableExtension, themeExtension, languageExtension, viewActiveLine()]
  }
}
