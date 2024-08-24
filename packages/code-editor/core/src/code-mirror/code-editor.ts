import { indentLess, insertTab } from '@codemirror/commands'
import { Compartment, EditorState, Extension, StateEffect, StateField } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  ViewUpdate,
} from '@codemirror/view'
import { minimalSetup } from 'codemirror'

import { appendConfigListener, viewActiveLine } from '../extension'
import { darkTheme, lightTheme } from '../theme'
import { CommandManager } from './commands'
import {
  CODE_EDITOR_DEFAULT_LANGUAGE,
  CodeEditorLanguages,
  type CodeEditorSupportedLanguage,
  type EditorLanguagePack,
} from './languages'

export type CodeEditorState = EditorState

export type CodeEditorView = EditorView

export interface CodeEditorDom extends HTMLElement {}

export type CodeEditorContent = string | Object

type CodeEditorTheme = 'light' | 'dark' | Extension

interface ExtraStateFields {
  [prop: string]: StateField<any>
}

export interface CodeEditorConfig {
  lineWrapping?: boolean
  lineNumber?: boolean
  activeLineGutter?: boolean
  theme?: CodeEditorTheme
  language?: CodeEditorSupportedLanguage
  editable?: boolean
  autoFocus?: boolean
  extraExtensions?: Extension[]
  extraFields?: ExtraStateFields
}

export interface CodeEditorConstructorProps extends CodeEditorConfig {
  state?: EditorState
  view?: EditorView
  dom?: CodeEditorDom
  content?: CodeEditorContent
}

export class CodeEditor {
  state: EditorState
  view: EditorView
  dom: CodeEditorDom

  extension: Extension[] = []
  extraFields?: ExtraStateFields

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
    theme = 'dark',
    editable = true,
    lineWrapping = false,
    lineNumber = true,
    activeLineGutter = true,
    language = CODE_EDITOR_DEFAULT_LANGUAGE,
    autoFocus = false,
    extraExtensions = [],
    extraFields,
  }: CodeEditorConstructorProps = {}) {
    this.#themeCompartment = new Compartment()
    this.#editableCompartment = new Compartment()
    this.#languageCompartment = new Compartment()

    this.theme = theme
    this.editorLanguages = { ...CodeEditorLanguages }

    this.autoFocus = autoFocus

    this.util = new CodeEditorUtil({ editor: this })

    this.extraFields = extraFields

    this.extension = this.initialExtension({
      lineWrapping,
      lineNumber,
      activeLineGutter,
      editable,
      theme,
      language,
      extraExtensions,
    })

    this.state = this.initialState({
      state,
      content,
      extension: this.extension,
    })

    this.view = this.initialView({ view, dom })

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

  initialState({
    state,
    content,
    extension,
  }: {
    state?: EditorState
    content?: CodeEditorContent
    extension?: Extension
  }): EditorState {
    if (state) return state

    if (typeof content === 'object') {
      return EditorState.fromJSON(content, { extensions: extension }, this.extraFields)
    }

    return EditorState.create({
      doc: content ?? '',
      extensions: extension,
    })
  }

  initialView({ view, dom }: { view?: EditorView; dom?: CodeEditorDom }) {
    if (view) return view

    return new EditorView({
      state: this.state,
      parent: dom ?? undefined,
    })
  }

  initialExtension({
    lineWrapping,
    lineNumber,
    activeLineGutter,
    editable = true,
    theme = 'dark',
    language = 'javascript',
    extraExtensions,
  }: Omit<CodeEditorConfig, 'autoFocus' | 'extraFields'>) {
    const editorInitialExtension: {
      lineWrapping?: Extension
      lineNumber?: Extension
      activeLineGutter?: Extension
    } = {
      ...(lineWrapping && { lineWrapping: EditorView.lineWrapping }),
      ...(lineNumber && { lineNumber: lineNumbers() }),
      ...(activeLineGutter && { activeLineGutter: highlightActiveLineGutter() }),
    }

    return [
      ...this.util.getBaseExtension({ editable, theme, language }),
      ...Array.from(Object.values(editorInitialExtension)),
      ...Array.from(
        Object.values({
          ...(extraExtensions && { extraExtensions }),
        }),
      ),
    ]
  }

  toText() {
    return this.view.state.doc.toString()
  }

  fromJSON(json: any) {
    return EditorState.fromJSON(json, { extensions: this.extension }, this.extraFields)
  }

  toJSON() {
    return this.view.state.toJSON(this.extraFields)
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

  removeExtension(extension: Extension) {
    const reconfigureExtension = this.extension.filter((ext) => ext != extension)

    if (reconfigureExtension.length === this.extension.length) return

    this.view.dispatch({ effects: StateEffect.reconfigure.of(reconfigureExtension) })
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

  subscribeUpdateListener(callback: (update: ViewUpdate) => void) {
    const extension = EditorView.updateListener.of(callback)

    this.addExtension([extension])

    return () => {
      this.removeExtension(extension)
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
    const state = this.editor.view?.state

    const {
      editable: editableCompartment,
      theme: themeCompartment,
      language: languageCompartment,
    } = this.editor.compartments

    const editableExtension = getExtensionFromCompartment({
      compartment: editableCompartment,
      state,
      fallbackExtension: editableCompartment.of(EditorView.editable.of(editable)),
    })

    const themeExtension = getExtensionFromCompartment({
      compartment: themeCompartment,
      state,
      fallbackExtension: themeCompartment.of(this.getThemeExtension(theme)),
    })

    const languageExtension = getExtensionFromCompartment({
      compartment: languageCompartment,
      state,
      fallbackExtension: languageCompartment.of(this.editor.editorLanguages[language]),
    })

    return [
      minimalSetup,
      keymap.of([
        {
          key: 'Tab',
          run: insertTab,
          shift: indentLess,
        },
      ]),
      editableExtension,
      themeExtension,
      languageExtension,
      appendConfigListener((extension) => {
        this.editor.extension = [...this.editor.extension, ...extension]
      }),
      viewActiveLine(),
    ]
  }
}

function getExtensionFromCompartment({
  compartment,
  state,
  fallbackExtension,
}: {
  compartment: Compartment
  state?: EditorState
  fallbackExtension: Extension
}) {
  if (state) {
    return compartment.get(state) ?? fallbackExtension
  }

  return fallbackExtension
}
