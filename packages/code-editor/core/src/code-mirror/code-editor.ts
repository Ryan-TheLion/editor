import { Compartment, EditorState, Extension, StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { minimalSetup } from 'codemirror'

import { CommandManager } from './commands'
import {
  CODE_EDITOR_DEFAULT_LANGUAGE,
  CodeEditorLanguages,
  type CodeEditorSupportedLanguage,
  type EditorLanguagePack,
} from './languages'

export class CodeEditor {
  state: EditorState
  view: EditorView
  dom: HTMLElement

  #languageCompartment: Compartment
  editorLanguages: EditorLanguagePack

  commandManager: CommandManager

  constructor({
    state,
    view,
    dom,
    content,
    extraExtensions = [],
  }: {
    state?: EditorState
    view?: EditorView
    dom?: HTMLElement
    content?: string
    extraExtensions?: Extension[]
  } = {}) {
    this.editorLanguages = { ...CodeEditorLanguages }
    this.#languageCompartment = new Compartment()

    const defaultLanguage = this.#languageCompartment.of(
      this.editorLanguages[CODE_EDITOR_DEFAULT_LANGUAGE],
    )

    this.state =
      state ??
      EditorState.create({
        doc: content ?? '',
        extensions: [minimalSetup, defaultLanguage, ...extraExtensions],
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
}
