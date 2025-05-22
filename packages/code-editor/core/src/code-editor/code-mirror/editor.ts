import { historyField } from '@codemirror/commands'
import {
  combineConfig,
  Compartment,
  EditorSelection,
  EditorState,
  Extension,
  Facet,
  StateEffect,
  StateField,
  Transaction,
} from '@codemirror/state'
import { Command, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

import { EditorFontPlugin } from './extension'

import { darkTheme, EditorThemeMode, lightTheme } from './theme'
import { editorColors, EditorThemeMap, editorThemeMap, editorThemeMode } from './theme/editor-theme'
import {
  compartmentHasExtension,
  deepReplace,
  flatten,
  isCompartmentInstance,
  isCompartmentReconfigureEffect,
} from '../../utils'
import {
  CODE_MIRROR_EDITOR_DEFAULT_LANGUAGE,
  codeMirrorEditorDefaultLanguages,
  CodeMirrorEditorDefaultLanguages,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorLanguagesKey,
  editorLanguage,
  editorLanguages,
} from './languages'
import { editorCssVarManager } from './extension/extension-css-var'
import { CodeEditorDOM, EditorContentPayload, StateFields, StateFieldSpec } from '../../typing'
import {
  activeLineNumberEffect,
  extensionFactory,
  editableExtension,
  fitContentExtension,
  languageExtension,
  lineNumberExtension,
  overflow,
  propsExtension,
  starterKit,
  themeExtension,
  updatePropsEffect,
  editorCallbackExtension,
} from './internal-extension'
import { ClipBoardCopy, ClipboardManager } from '../../clipboard-manager'
import { codeMirrorBaseCommands, CodeMirrorBaseCommands } from './commands'

export { type ExtensionFactory } from './internal-extension'

export type AnyCodeMirrorEditor = CodeMirrorEditor<CodeMirrorEditorLanguages<string>, HeightValue>

export type AnyCodeMirrorEditorProps = CodeMirrorEditorProps<
  CodeMirrorEditorLanguages<string>,
  HeightValue
>

export type CodeMirrorEditorContent = string | Record<any, any>

type PositiveNumber<NumberFormat extends string | number> = `${NumberFormat}` extends `-${number}`
  ? never
  : NumberFormat

type ValidHeight<Format extends HeightValue> =
  Format extends `${infer N extends number}${HeightUnit}`
    ? PositiveNumber<N> extends never
      ? 'none'
      : Format
    : never

type HeightUnit = 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw'

export type HeightValue = `${number}${HeightUnit}`

type MaxHeight<Height extends HeightValue> = ValidHeight<Height>

export interface CodeMirrorEditorConfig<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> {
  editable?: boolean
  dom?: CodeEditorDOM
  theme?: EditorThemeMap
  themeMode?: EditorThemeMode
  maxHeight?: MaxHeight<MaxHeightValue>
  languages?: Languages
  language?: CodeMirrorEditorLanguagesKey<Languages>
  extensions?: Extension[]
  autoFocus?: boolean
  lineNumber?: boolean
  fitContent?: boolean
}

export interface CodeMirrorEditorProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends CodeMirrorEditorConfig<Languages, MaxHeightValue> {
  content?: CodeMirrorEditorContent
  disableTransaction?: (tr: Transaction) => void | boolean
  onChange?: (payload: EditorContentPayload) => void
  onDestroy?: (view: EditorView) => void
}

export interface EditorCompartments {
  extensions: Compartment
  props: Compartment
  editable: Compartment
  languages: Compartment
  language: {
    name: Compartment
    support: Compartment
  }
  theme: {
    map: Compartment
    extension: Compartment
    mode: Compartment
  }
  lineNumbers: Compartment
  fitContent: Compartment
  focusing: Compartment
}

export const editorHasFocus = Facet.define<boolean, boolean>({
  combine([value]) {
    return !!value
  },
})

export const DEFAULT_CODE_MIRROR_EDITOR_CONFIG: Omit<
  Required<CodeMirrorEditorConfig>,
  'maxHeight' | 'dom'
> = {
  editable: true,
  languages: codeMirrorEditorDefaultLanguages,
  language: CODE_MIRROR_EDITOR_DEFAULT_LANGUAGE,
  theme: {
    light: lightTheme,
    dark: darkTheme,
  },
  extensions: [],
  themeMode: 'dark',
  autoFocus: false,
  lineNumber: true,
  fitContent: false,
}

/*
 * 가로 scroll 의 width가 scroll을 하면서 동적으로 변경되는 이슈가 있음
 * (https://discuss.codemirror.net/t/horizontal-scrollbar-resize-issue/4592/2)
 *
 * - 스크롤을 하면서 동적으로 scrollDOM이 수정되는 것 같으며,
 *   스크롤을 하면서 현재보다 긴 줄을 만난다면 이후에 width가 긴 줄에 맞춰지도록 css 적용은 되있음
 * - CodeMirrorEditor 클래스의 scan 메소드로 가로 스크롤이 있을 경우,
 *   스크롤 top 을 0 부터 끝까지 스크롤해서 가장 긴 줄의 넓이가 최초에 적용되도록 조치할 수 있음
 *   - 적용할 경우, 초기화를 끝내기 전까지 fallback UI를 보여줄 수 있도록 에디터 클래스 수정이 필요할 수 있음
 *   - 코드미러 방향성과 맞지 않는 것 같아 현재는 적용하지 않음
 */

export class CodeMirrorEditor<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> {
  state: EditorState
  view: EditorView
  dom: CodeEditorDOM | null

  #initialProps: CodeMirrorEditorProps<Languages, MaxHeightValue>

  #extensions: Extension[] = []
  #stateFields!: StateFields | null

  #editorCompartments: EditorCompartments

  #subscribeUpdateListenerSet: Set<(update: ViewUpdate) => void> = new Set()

  #clipBoardManager = new ClipboardManager()

  constructor({
    dom,
    content,
    maxHeight,
    theme = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.theme,
    themeMode = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.themeMode,
    editable = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.editable,
    languages = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.languages as any,
    language = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.language as any,
    autoFocus = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.autoFocus,
    extensions = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.extensions,
    lineNumber = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.lineNumber,
    fitContent = DEFAULT_CODE_MIRROR_EDITOR_CONFIG.fitContent,
    disableTransaction,
    onChange,
    onDestroy,
  }: CodeMirrorEditorProps<Languages, MaxHeightValue> = {}) {
    this.#initialProps = {
      dom,
      content,
      maxHeight,
      theme,
      themeMode,
      editable,
      languages,
      language,
      autoFocus,
      extensions,
      lineNumber,
      fitContent,
      disableTransaction,
      onChange,
      onDestroy,
    }

    this.#editorCompartments = {
      extensions: new Compartment(),
      props: new Compartment(),
      editable: new Compartment(),
      languages: new Compartment(),
      language: {
        name: new Compartment(),
        support: new Compartment(),
      },
      theme: {
        map: new Compartment(),
        extension: new Compartment(),
        mode: new Compartment(),
      },
      lineNumbers: new Compartment(),
      fitContent: new Compartment(),
      focusing: new Compartment(),
    }

    const {
      view: editorView,
      state: editorState,
      viewDOM,
      extensions: initialExtensions,
      stateFields: editorStateFields,
    } = this.initEditor({
      dom,
      content,
      initialExtensions: extensions,
    })

    this.view = editorView
    this.state = editorState

    this.dom = viewDOM

    this.#extensions = initialExtensions
    this.#stateFields = editorStateFields

    if (this.dom === null) return

    this.autoFocus && this.#autoFocusToView()
  }

  get props() {
    try {
      return this.view.state.facet(editorProps.reader) as unknown as CodeMirrorEditorProps<
        Languages,
        MaxHeightValue
      >
    } catch (e) {
      return this.#initialProps as unknown as CodeMirrorEditorProps<Languages, MaxHeightValue>
    }
  }

  get editable() {
    try {
      return this.view.state.facet(EditorView.editable.reader)
    } catch (e) {
      return this.props.editable!
    }
  }

  get languages() {
    return this.view.state.facet(editorLanguages.reader) as Languages
  }

  get language() {
    return this.view.state.facet(editorLanguage.reader) as CodeMirrorEditorLanguagesKey<Languages>
  }

  get themeMap() {
    return this.view.state.facet(editorThemeMap.reader)
  }

  get themeMode() {
    return this.view.state.facet(editorThemeMode.reader)
  }

  get cssVarManager() {
    return this.view.state.facet(editorCssVarManager.reader)
  }

  get colors() {
    return this.view.state.facet(editorColors.reader)
  }

  get extensions() {
    return this.#extensions
  }

  get supportedLanguages() {
    return Array.from(
      Object.keys(this.view.state.facet(editorLanguages.reader)),
    ) as unknown as CodeMirrorEditorLanguagesKey<Languages>[]
  }

  get stateFields() {
    return this.#stateFields
  }

  get autoFocus() {
    return this.props.autoFocus
  }

  initEditor({
    dom,
    content,
    initialExtensions,
  }: {
    dom?: CodeEditorDOM
    content?: CodeMirrorEditorContent
    initialExtensions?: Extension[]
  }): {
    view: EditorView
    state: EditorState
    viewDOM: CodeEditorDOM | null
    extensions: Extension[]
    stateFields: StateFields | null
  } {
    const {
      state,
      stateFields,
      extensions,
    }: { state: EditorState; stateFields: StateFields | null; extensions: Extension[] } = (() => {
      const extensions = this.#initExtensions(initialExtensions)
      const stateFields = CodeMirrorEditor.extractStateFields(extensions)

      if (typeof content === 'object') {
        return {
          state: this.fromJSON({
            json: content,
            extensions,
          }),
          stateFields,
          extensions,
        }
      }

      return {
        state: EditorState.create({
          doc: content ?? '',
          extensions,
          ...(content && { selection: EditorSelection.cursor(content.length) }),
        }),
        stateFields,
        extensions,
      }
    })()

    const view = new EditorView({
      state,
      scrollTo: EditorView.scrollIntoView(state.selection.main, { x: 'center', y: 'center' }),
    })

    let viewDOM: CodeEditorDOM | null = null

    if (dom) {
      dom.replaceWith(view.dom)
      viewDOM = view.dom
    }

    const maxHeight = view.state.facet(editorProps.reader).maxHeight

    if (maxHeight) {
      view.dom.style.maxHeight = maxHeight
    }

    return {
      view,
      state: view.state,
      viewDOM,
      stateFields,
      extensions,
    }
  }

  fromJSON({ json, extensions }: { json: any; extensions?: Extension }) {
    /*
      editable 할 경우 json의 selection을 그대로 반영,
      아닐 경우 selection을 보정하여 초기화
    */
    const selection = (() => {
      if ('selection' in json) {
        const editorSelection = EditorSelection.fromJSON(json.selection)

        return this.editable ? editorSelection : EditorSelection.single(0)
      }

      return undefined
    })()

    const editorExtensions = extensions ?? undefined
    const editorStateFields = editorExtensions
      ? (CodeMirrorEditor.extractStateFields(
          Array.isArray(editorExtensions) ? editorExtensions : [editorExtensions],
        ) ?? undefined)
      : undefined

    return EditorState.fromJSON(
      {
        ...json,
        ...(selection && { selection: selection.toJSON() }),
      },
      {
        extensions: editorExtensions,
      },
      editorStateFields,
    )
  }

  toJSON({ excludeStateFields = [historyField] }: { excludeStateFields?: StateField<any>[] } = {}) {
    const targetStateFields = (({
      stateFields,
      excludeStateFields,
    }: {
      stateFields: StateFields | null
      excludeStateFields: StateField<any>[]
    }) => {
      if (!stateFields) return null

      const excludeTargetStateFields = excludeStateFields.length
        ? excludeStateFields
        : [historyField]

      const resultFields = excludeTargetStateFields.length
        ? Array.from(Object.entries(stateFields)).reduce((fields, [key, field]) => {
            if (
              excludeStateFields.find(
                (excludeTargetStateField) => excludeTargetStateField === field,
              )
            ) {
              return {
                ...fields,
              }
            }

            return {
              ...fields,
              [key]: field,
            }
          }, {} as StateFields)
        : stateFields

      if (!Object.keys(resultFields).length) return null

      return resultFields
    })({
      stateFields: this.stateFields,
      excludeStateFields,
    })

    const safeStateFields = CodeMirrorEditor.getToJsonSafeStateFields(targetStateFields)

    return this.view.state.toJSON(safeStateFields ?? undefined)
  }

  toText() {
    return this.view.state.doc.toString()
  }

  async copy({ success, error, copying }: ClipBoardCopy = {}) {
    this.#clipBoardManager.copy(this.toText(), { success, error, copying })
  }

  updateProps(props: Partial<CodeMirrorEditorProps<Languages, MaxHeightValue>>) {
    if (!Object.keys(props).length) return

    this.view.dispatch({
      effects: updatePropsEffect.of(
        props as CodeMirrorEditorProps<CodeMirrorEditorLanguages<string>, MaxHeightValue>,
      ),
    })

    if (props.maxHeight != null && getComputedStyle(this.view.dom).maxHeight !== props.maxHeight) {
      this.view.dom.style.maxHeight = props.maxHeight
    }

    if (props.dom != null && props.dom !== this.view.dom) {
      this.attachDom(props.dom)
    }
  }

  #initExtensions(pluginExtensions: Extension[] = []) {
    const extensions = [
      this.#editorCompartments.extensions.of(editorExtensions.of(this.extensions)),
      propsExtension<Languages, MaxHeightValue>({
        propsCompartments: this.#editorCompartments.props,
        initialProps: {
          ...this.props,
        },
      }),
      editableExtension({
        editableCompartment: this.#editorCompartments.editable,
        initialEditable: this.editable,
      }),
      themeExtension({
        themeCompartment: this.#editorCompartments.theme,
        initial: {
          theme: this.props.theme!,
          themeMode: this.props.themeMode!,
        },
      }),
      languageExtension<Languages>({
        compartment: {
          languages: this.#editorCompartments.languages,
          language: this.#editorCompartments.language,
        },
        languages: this.props.languages as Languages,
        language: this.props.language!,
      }),
      lineNumberExtension({
        lineNumberCompartment: this.#editorCompartments.lineNumbers,
        initialActive: this.props.lineNumber!,
      }),
      overflow(),
      fitContentExtension({
        fitContentCompartment: this.#editorCompartments.fitContent,
        initialActive: !!this.props.fitContent,
      }),
      EditorState.allowMultipleSelections.of(true),
      ...pluginExtensions,
      ViewPlugin.define((view) => {
        // reconfigure: + has focus, editor css var manager

        const getEditor = () => {
          return this
        }

        return new (class {
          constructor(view: EditorView) {
            queueMicrotask(() => {
              const reconfigExtensions = [
                ...getEditor().extensions,
                getEditor().#editorCompartments.focusing.of(editorHasFocus.of(view.hasFocus)),
                editorCssVarManager.of({
                  view: view,
                  themeMode: view.state.facet(editorProps.reader).themeMode,
                }),
              ]

              view.dispatch({
                effects: [StateEffect.reconfigure.of(reconfigExtensions)],
              })
            })
          }
        })(view)
      }),
      EditorView.domEventObservers({
        focusin: (event, view) => {
          view.dispatch({
            effects: this.#editorCompartments.focusing.reconfigure(
              editorHasFocus.of(view.hasFocus),
            ),
          })
        },
        focusout: (event, view) => {
          view.dispatch({
            effects: this.#editorCompartments.focusing.reconfigure(
              editorHasFocus.of(view.hasFocus),
            ),
          })
        },
      }),
      EditorView.updateListener.of((update) => {
        // append config listener

        const appendConfigEffects = update.transactions
          .flatMap((tr) => tr.effects)
          .filter((effect) => effect.is(StateEffect.appendConfig))

        if (!appendConfigEffects.length) return

        const extensions = update.state.facet(editorExtensions.reader)
        const reconfigExtensions = Array.isArray(extensions)
          ? extensions
          : extensions === null
            ? []
            : [extensions]

        for (const appendConfigEffect of appendConfigEffects) {
          reconfigExtensions.push(appendConfigEffect.value)
        }

        this.#extensions = reconfigExtensions
        this.#stateFields = CodeMirrorEditor.extractStateFields(reconfigExtensions)

        update.view.dispatch({
          effects: this.#editorCompartments.extensions.reconfigure(
            editorExtensions.of(reconfigExtensions),
          ),
        })
      }),
      EditorView.updateListener.of((update) => {
        // reconfigure listener

        const reconfigureEffect = update.transactions
          .flatMap((tr) => tr.effects)
          .findLast((effect) => effect.is(StateEffect.reconfigure))

        if (!reconfigureEffect) return

        const extensions = update.state.facet(editorExtensions.reader)
        let reconfigExtensions = Array.isArray(extensions)
          ? extensions
          : extensions === null
            ? []
            : [extensions]

        reconfigExtensions = Array.isArray(reconfigureEffect.value)
          ? reconfigureEffect.value
          : [reconfigureEffect.value]

        this.#extensions = reconfigExtensions
        this.#stateFields = CodeMirrorEditor.extractStateFields(reconfigExtensions)

        update.view.dispatch({
          effects: this.#editorCompartments.extensions.reconfigure(
            editorExtensions.of(reconfigExtensions),
          ),
        })
      }),
      EditorView.updateListener.of((update) => {
        // compartment reconfigure listener

        const compartmentEffects = update.transactions
          .flatMap((tr) => tr.effects)
          .filter((effect) => isCompartmentReconfigureEffect(effect))
          .map((effect) => effect.value)

        if (!compartmentEffects.length) return

        for (const { compartment, extension } of compartmentEffects) {
          deepReplace<any>(this.#extensions, {
            target(value) {
              if (!isCompartmentInstance(value)) return false

              return value.compartment === compartment
            },
            replace(value) {
              if (!isCompartmentInstance(value)) return value

              value.inner = extension

              return value
            },
          })
        }
      }),
      EditorView.updateListener.of((update) => {
        // subscribe update

        const callbacks = Array.from(this.#subscribeUpdateListenerSet.values())

        callbacks.forEach((callback) => callback(update))
      }),
      editorCallbackExtension({ editor: this }),
    ]

    return extensions
  }

  attachDom<DomElement extends HTMLElement>(targetDom: DomElement) {
    if (!this.view) return

    const { extensions: initialExtensions } = this.view.state.facet(editorProps.reader)

    const { view, state, viewDOM, stateFields, extensions } = this.initEditor({
      dom: targetDom,
      content: this.dom ? this.toJSON() : this.props.content,
      initialExtensions,
    })

    this.view.destroy()

    this.view = view
    this.state = state

    this.dom = viewDOM

    this.#extensions = extensions
    this.#stateFields = stateFields

    this.autoFocus && this.editable && this.#autoFocusToView()

    this.props.onChange?.({
      text: this.toText(),
      json: this.toJSON(),
    })
  }

  async #autoFocusToView() {
    if (this.view.hasFocus) return
    if (!this.editable) return

    await document.fonts.ready

    const pluginFonts = EditorFontPlugin.fonts

    if (pluginFonts.hasFonts()) {
      await pluginFonts.ready
    }

    this.view.requestMeasure({
      read(view) {
        setTimeout(() => {
          view.dispatch({
            annotations: [Transaction.addToHistory.of(false)],
            selection: view.state.selection,
          })

          view.focus()
        }, 0)
      },
    })
  }

  setEditable(callback: boolean | ((editable: boolean) => boolean)) {
    const currentEditable = this.editable

    const editable = typeof callback === 'boolean' ? callback : callback(currentEditable)

    this.view.dispatch({
      effects: updatePropsEffect.of({ editable }),
    })

    if (!this.view.hasFocus && this.editable && this.autoFocus) {
      this.view.focus()
    }
  }

  setLanguage(language: CodeMirrorEditorLanguagesKey<Languages>) {
    this.view.dispatch({
      effects: updatePropsEffect.of({
        language: language as string,
      }),
    })
  }

  setThemeMode(callback: EditorThemeMode | ((themeMode: EditorThemeMode) => EditorThemeMode)) {
    const currentThemeMode = this.themeMode

    const themeMode =
      callback === 'light' || callback === 'dark' ? callback : callback(currentThemeMode!)

    this.view.dispatch({
      effects: updatePropsEffect.of({
        themeMode,
      }),
    })
  }

  activeLineNumbers(callback: boolean | ((active: boolean) => boolean)) {
    const currentActive = compartmentHasExtension({
      compartment: this.#editorCompartments.lineNumbers,
      state: this.view.state,
    })

    const active = typeof callback === 'boolean' ? callback : callback(currentActive)

    this.view.dispatch({
      effects: activeLineNumberEffect.of(active),
    })
  }

  subscribeUpdateListener(callback: (update: ViewUpdate) => void) {
    this.#subscribeUpdateListenerSet.add(callback)

    return () => {
      this.#subscribeUpdateListenerSet.delete(callback)
    }
  }

  runCommand(
    command: Command | keyof CodeMirrorBaseCommands,
    { focus = true }: { focus?: boolean } = {},
  ) {
    if (focus) this.view.focus()

    const targetCommand = typeof command === 'string' ? codeMirrorBaseCommands[command] : command

    return targetCommand(this.view)
  }

  static extensionFactory = extensionFactory

  static starterKit = starterKit()

  /**
   * extension 배열에서 stateFields 를 추출
   *
   * - options
   *   - `excludes`
   *     - 추출된 stateFields에서 제외하고 싶은 stateField 배열
   *     - 제공하지 않거나 빈 배열일 경우 제외되는 stateFields에서 필드는 없음
   */
  static extractStateFields(
    extensions: Extension[],
    { excludes }: { excludes: StateField<any>[] } = { excludes: [] },
  ) {
    const stateFieldArray = flatten(extensions).filter((item) => item instanceof StateField)

    if (!stateFieldArray.length) return null

    const excludeStateFields = excludes.length ? excludes : null

    const stateFields = stateFieldArray.reduce((fields, field) => {
      const fieldId = (field as StateField<any> & { id: number }).id

      if (
        excludeStateFields &&
        excludeStateFields.find((excludeStateField) => excludeStateField === field)
      ) {
        return {
          ...fields,
        }
      }

      return {
        ...fields,
        [`cm-state-field-${fieldId}`]: field,
      }
    }, {} as StateFields)

    if (!Object.keys(stateFields).length) return null

    return stateFields
  }

  /**
   * toJSON 이 가능한 stateField만 추출해서 반환
   *
   * (stateField define에서 toJSON 을 정의하지 않은 경우 state.toJSON 메소드에서 에러 발생)
   */
  static getToJsonSafeStateFields(stateFields: StateFields | null) {
    if (!stateFields || !Object.keys(stateFields).length) return null

    const safeStateFields = Array.from(Object.entries(stateFields)).reduce(
      (fields, [key, field]) => {
        const hasToJSON = !!(field as StateField<any> & { spec: StateFieldSpec<any> }).spec?.toJSON

        if (!hasToJSON) {
          return {
            ...fields,
          }
        }

        return {
          ...fields,
          [key]: field,
        }
      },
      {} as StateFields,
    )

    if (!Object.keys(safeStateFields).length) return null

    return safeStateFields
  }

  /**
   * stateFields 의 JSON
   *
   * `{ [stateField key]: stateFieldJSON }` 형식의 객체
   */
  static stateFieldsJSON({
    stateFields,
    state,
  }: {
    stateFields: StateFields | null
    state: EditorState
  }) {
    if (!stateFields || !Object.keys(stateFields).length) return null

    const safeStateFields = CodeMirrorEditor.getToJsonSafeStateFields(stateFields)

    if (!safeStateFields) return null

    return Array.from(Object.entries(safeStateFields)).reduce((fields, [key, field]) => {
      const fieldValue = state.field(field)

      const fieldJSON = (field as StateField<any> & { spec: StateFieldSpec<any> }).spec.toJSON!(
        fieldValue,
        state,
      )

      return {
        ...fields,
        [key]: fieldJSON,
      }
    }, {} as StateFields)
  }

  static hasOverflow(view: EditorView) {
    const { clientWidth, clientHeight, scrollWidth, scrollHeight } = view.scrollDOM

    return {
      horizontal: clientWidth < scrollWidth,
      vertical: clientHeight < scrollHeight,
    }
  }

  static scan(view: EditorView, autoFocus?: boolean) {
    return new Promise((resolve) => {
      const getTargetTop = (view: EditorView) => {
        return view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight
      }

      const selection = view.state.selection

      let top = 0
      let targetTop = getTargetTop(view)

      view.requestMeasure({
        read(view) {
          if (!CodeMirrorEditor.hasOverflow(view).horizontal) {
            resolve(true)

            if (autoFocus) view.focus()

            return
          }

          view.dom.scroll({ top: 0 })

          const intervalId = setInterval(() => {
            if (top > targetTop) {
              clearInterval(intervalId)

              view.dispatch({
                effects: EditorView.scrollIntoView(selection.main, { x: 'center', y: 'center' }),
              })

              resolve(true)

              if (autoFocus) view.focus()

              return
            }

            view.scrollDOM.scroll({ top: (top += 100) })

            targetTop = getTargetTop(view)
          }, 0)
        },
      })
    })
  }

  static language = editorLanguage

  static theme = editorThemeMap

  static themeMode = editorThemeMode

  static focusing = editorHasFocus
}

//

export const editorProps = Facet.define<
  CodeMirrorEditorProps<any, any>,
  Omit<
    Required<CodeMirrorEditorProps<any, any>>,
    'content' | 'dom' | 'maxHeight' | 'onChange' | 'onDestroy'
  > & {
    content?: CodeMirrorEditorProps['content']
    dom?: CodeMirrorEditorProps['dom']
    maxHeight?: MaxHeight<HeightValue>
    onChange?: CodeMirrorEditorProps['onChange']
    onDestroy?: CodeMirrorEditorProps['onDestroy']
  }
>({
  combine(value) {
    return combineConfig<Required<CodeMirrorEditorProps<any, any>>>(value, {
      ...DEFAULT_CODE_MIRROR_EDITOR_CONFIG,
      content: undefined,
      dom: undefined,
      maxHeight: undefined,
      disableTransaction: undefined,
      onChange: undefined,
      onDestroy: undefined,
    })
  },
})

export const editorExtensions = Facet.define<Extension, Extension | null>({
  combine([extension]) {
    if (Array.isArray(extension) && !extension.length) return null

    return extension ?? null
  },
})
