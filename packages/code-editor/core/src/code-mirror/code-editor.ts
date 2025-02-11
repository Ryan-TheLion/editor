import {
  defaultKeymap,
  history,
  historyField,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { Language, language } from '@codemirror/language'
import { Compartment, EditorState, Extension, StateEffect, StateField } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  ViewUpdate,
} from '@codemirror/view'
import { minimalSetup } from 'codemirror'

import {
  appendConfigListener,
  firaCodeFont,
  lineHighlight,
  scrollbar,
  viewActiveLine,
} from '../extension'
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

export type CodeEditorThemeMode = 'light' | 'dark'

export type CodeEditorTheme = {
  light: Extension
  dark: Extension
}

export interface StateFields {
  [prop: string]: StateField<any>
}

export type CreateExtensionCallback = (baseExtension: {
  minimalSetup: typeof minimalSetup
  drawSelection: typeof drawSelection
  lineWrapping: typeof EditorView.lineWrapping
  lineNumbers: typeof lineNumbers
  activeLineGutter: typeof highlightActiveLineGutter
  history: typeof history
  keymap: {
    extension: typeof keymap
    indentWithTab: typeof indentWithTab
    historyKeymap: typeof historyKeymap
    defaultKeymap: typeof defaultKeymap
  }
}) => Extension[]

export interface CodeEditorConfig {
  editable?: boolean
  theme?: CodeEditorTheme
  initialThemeMode?: CodeEditorThemeMode
  language?: CodeEditorSupportedLanguage
  extensions?: Extension[]
  autoFocus?: boolean
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

  extensions: Extension[] = []
  #stateFields!: StateFields | null

  autoFocus: boolean

  #theme!: CodeEditorTheme
  #themeMode!: CodeEditorThemeMode
  #themeCompartment!: Compartment

  editorLanguages!: EditorLanguagePack
  #languageCompartment!: Compartment

  #editableCompartment!: Compartment

  commandManager: CommandManager

  /**
   * 에디터에서 사용할 extensions를 커스텀해서 만들 수 있도록 도와주는 유틸 함수
   * @example
   * ```ts
   * new CodeEditor({
   *   // ...
   *   extensions: CodeEditor.createInitialExtensions(({lineWrapping, lineNumbers, history, keymap}) => {
   *    return [
   *      history(),
   *      lineNumbers(),
   *      lineWrapping,
   *      firaCodeFont(), // 외부 extension
   *      keymap.extension.of([
   *        keymap.indentWithTab,
   *        ...keymap.historyKeymap,
   *        ...keymap.defaultKeymap
   *      ])
   *    ]
   *   })
   * })
   * ```
   */
  static createInitialExtensions(callback: CreateExtensionCallback): Extension[] {
    return callback({
      minimalSetup,
      drawSelection,
      lineWrapping: EditorView.lineWrapping,
      lineNumbers,
      activeLineGutter: highlightActiveLineGutter,
      history,
      keymap: {
        extension: keymap,
        indentWithTab,
        historyKeymap,
        defaultKeymap,
      },
    })
  }

  /**
   * extensions
   *
   * ```
   * [
   *   history(),
   *   scrollbar({ horizontal: true }),
   *   drawSelection(),
   *   lineNumbers(),
   *   highlightActiveLine(),
   *   highlightActiveLineGutter(),
   *   lineHighlight(),
   *   viewActiveLine(),
   *   firaCodeFont(),
   *   keymap.of([indentWithTab, ...historyKeymap, ...defaultKeymap])
   * ]
   * ```
   *
   * @example
   * ```ts
   * new CodeEditor({
   *   // ...
   *   extensions: CodeEditor.starterKit
   * })
   * ```
   */
  static starterKit = [
    history(),
    scrollbar({ horizontal: true }),
    drawSelection(),
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    lineHighlight(),
    viewActiveLine(),
    firaCodeFont(),
    keymap.of([indentWithTab, ...historyKeymap, ...defaultKeymap]),
  ]

  static extractStateFields(extensions: Extension[]) {
    const stateFieldArray = flatten(extensions).filter((item) => item instanceof StateField)

    if (!stateFieldArray.length) return null

    return stateFieldArray.reduce((fields, field) => {
      const fieldId = (field as StateField<any> & { id: number }).id

      return {
        ...fields,
        [`cm-state-field-${fieldId}`]: field,
      }
    }, {} as StateFields)
  }

  constructor({
    state,
    view,
    dom,
    content,
    theme = {
      light: lightTheme,
      dark: darkTheme,
    },
    initialThemeMode = 'dark',
    editable = true,
    language = CODE_EDITOR_DEFAULT_LANGUAGE,
    autoFocus = false,
    extensions = [],
  }: CodeEditorConstructorProps = {}) {
    const EditableExtension = this.initialEditable(editable)
    const ThemeExtension = this.initialTheme({ theme, themeMode: initialThemeMode })
    const LanguageExtension = this.initialLanguage({ languagePack: CodeEditorLanguages, language })

    this.autoFocus = autoFocus

    this.extensions = [
      EditableExtension,
      ThemeExtension,
      LanguageExtension,
      ...extensions,
      appendConfigListener((extension) => {
        console.log({ extension, this: this })
        this.extensions = [...this.extensions, ...extension]
      }),
    ]

    this.#stateFields = CodeEditor.extractStateFields(extensions)

    this.state = this.initialState({
      state,
      content,
      extensions: this.extensions,
    })

    this.view = this.initialView({ view, dom })

    this.dom = this.view.dom

    if (this.autoFocus) this.view.focus()

    this.commandManager = new CommandManager({ editor: this })
  }

  get editable() {
    return this.view.state.facet(EditorView.editable.reader)
  }

  get language() {
    return this.#getLanguageFromFacet(this.view.state.facet(language))
  }

  get theme(): CodeEditorTheme {
    return this.#theme
  }

  get themeMode(): CodeEditorThemeMode {
    return this.#themeMode
  }

  get stateFields(): StateFields | null {
    return this.#stateFields
  }

  initialState({
    state,
    content,
    extensions,
  }: {
    state?: EditorState
    content?: CodeEditorContent
    extensions?: Extension
  }): EditorState {
    if (state) return state

    if (typeof content === 'object') {
      return this.fromJSON(content)
    }

    return EditorState.create({
      doc: content ?? '',
      extensions,
    })
  }

  initialView({ view, dom }: { view?: EditorView; dom?: CodeEditorDom }) {
    if (view) return view

    return new EditorView({
      state: this.state,
      parent: dom ?? undefined,
    })
  }

  initialEditable(editable: boolean) {
    this.#editableCompartment = new Compartment()

    return this.#editableCompartment.of(EditorView.editable.of(editable))
  }

  initialTheme({ theme, themeMode }: { theme: CodeEditorTheme; themeMode: CodeEditorThemeMode }) {
    this.#themeCompartment = new Compartment()

    this.#theme = theme
    this.#themeMode = themeMode

    return this.#themeCompartment.of(this.theme[themeMode])
  }

  initialLanguage({
    languagePack,
    language,
  }: {
    languagePack: EditorLanguagePack
    language: CodeEditorSupportedLanguage
  }) {
    this.#languageCompartment = new Compartment()

    const editorLanguagePack = {
      ...languagePack,
    }

    this.editorLanguages = editorLanguagePack

    return this.#languageCompartment.of(editorLanguagePack[language])
  }

  toText() {
    return this.view.state.doc.toString()
  }

  fromJSON(json: any) {
    return EditorState.fromJSON(
      json,
      { extensions: this.extensions },
      this.#stateFields ?? undefined,
    )
  }

  toJSON(opt?: { excludedStateFields: StateField<any>[] }) {
    const stateFields = (({
      editorStateFields,
      excludeStateFields,
    }: {
      editorStateFields: StateFields | null
      excludeStateFields?: StateField<any>[]
    }) => {
      if (!editorStateFields) return undefined

      const excludeFields = excludeStateFields?.length ? excludeStateFields : [historyField]
      if (!excludeFields.length) return editorStateFields

      return Array.from(Object.entries(editorStateFields)).reduce((fields, [key, field]) => {
        if (excludeFields.find((excludeField) => excludeField === field)) {
          return {
            ...fields,
          }
        }

        return {
          ...fields,
          [key]: field,
        }
      }, {} as StateFields)
    })({
      editorStateFields: this.#stateFields,
      excludeStateFields: opt?.excludedStateFields,
    })

    return this.view.state.toJSON(stateFields)
  }

  attachDom<DomElement extends HTMLElement>(targetDom: DomElement) {
    if (this.dom.parentElement === targetDom) return

    targetDom.append(this.dom)

    if (this.autoFocus) this.view.focus()
  }

  #getLanguageFromFacet(facet: Language | null) {
    if (!facet) return null

    const { name, parser } = facet

    // @ts-ignore
    const source = parser?.dialect?.source

    if (name === 'javascript') {
      return source === 'jsx' ? 'jsx' : 'javascript'
    }

    if (name === 'typescript') {
      return source === 'jsx ts' ? 'tsx' : 'typescript'
    }

    return null
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
    const reconfigureExtension = this.extensions.filter((ext) => ext != extension)

    if (reconfigureExtension.length === this.extensions.length) return

    this.view.dispatch({ effects: StateEffect.reconfigure.of(reconfigureExtension) })
  }

  changeThemeMode(themeMode: CodeEditorThemeMode) {
    const currentThemeMode = this.themeMode

    if (currentThemeMode === themeMode) return

    this.view.dispatch({
      effects: this.#themeCompartment.reconfigure(this.theme[themeMode]),
    })

    this.#themeMode = themeMode
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

function flatten<T>(array: Array<T>) {
  let flattenedArray: T[] = []

  for (const item of array) {
    if (Array.isArray(item)) {
      flattenedArray = [...flattenedArray, ...flatten(item)]

      continue
    }

    flattenedArray = [...flattenedArray, item]
  }

  return flattenedArray
}
