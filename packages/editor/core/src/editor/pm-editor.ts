import '../prose-mirror/style.scss'

import { debounce, isPlainObject } from 'lodash-es'
import { selectParentNode } from 'prosemirror-commands'
import {
  Attrs,
  DOMParser as PmDOMParser,
  DOMSerializer as PmDOMSerializer,
  MarkType,
  Node,
  NodeType,
  Schema,
} from 'prosemirror-model'
import { Command, EditorState, Plugin } from 'prosemirror-state'
import { DirectEditorProps, EditorView } from 'prosemirror-view'

import {
  Document,
  ExtensionList,
  ExtensionManager,
  Paragraph,
  Text,
} from '../prose-mirror/extensions'
import {
  isNodeSelection,
  isSelectedNode,
  selectionHasMark,
  selectionHasNodeType,
} from '../prose-mirror/utils'
import {
  CanCommandParams,
  Dispatch,
  DomElement,
  EditorChanged,
  EditorCompositionDebounce,
  EditorUpdateCallback,
  InitialEditorContent,
  MaybeExcuteCommand,
  RawCommand,
  SingleCommand,
} from '../typing'
import { EditorUpdateObserver } from './editor-update-observer'

interface AttachDomOption extends Pick<HTMLElement, 'spellcheck'> {}

export interface EditorConfig extends Partial<AttachDomOption> {
  autoFocus?: boolean
  editable?: boolean
  /**
   * - composition (IME 입력) 상태에서 일정 시간(ms) 이후 자동으로 composition을 종료
   *   - 기본값 `1000` (1000ms = 1초)
   *   - `false`로 설정할 경우 composition 을 직접 해제(화살표 키 입력으로 커서 이동 등)해야 composition이 종료 (Prosemirror 기본 동작)
   */
  autoCompositionend?: number | false
}

export interface EditorCallbackProps {
  onUpdate?: EditorUpdateCallback
}

export interface EditorConstructorProps extends EditorConfig, EditorCallbackProps {
  state?: EditorState
  view?: EditorView
  /**
   * 에디터 초기 content
   * - JSON, 문자열(또는 html 문자열) 가능
   */
  content?: InitialEditorContent
  /**
   * 적용할 extension 의 배열
   * - 제공하지 않을 경우 `[Document, Paragraph, Text]` 가 기본으로 설정 됨
   *   - 최소한으로 동작하기 위해 필요한 노드들이기 때문
   */
  extensions?: ExtensionList
  dom?: DomElement
}

export const ZERO_WIDTH_SPACE_UNICODE = '\u200B'

export class Editor {
  state: EditorState
  view: EditorView

  #config: Readonly<EditorConfig>

  #viewProps: Omit<DirectEditorProps, 'state'>

  #compositionDebounce: EditorCompositionDebounce | null = null

  #extensionManager: ExtensionManager
  #updateObserver: EditorUpdateObserver

  #pressedHanjaMode: boolean = false

  get config() {
    return this.#config
  }

  /**
   * `editable: false` 일 때 예외적으로 transaction을 적용시키기 위한 meta key
   * - `tr.setMeta(Editor.ALLOW_TRANSACTION_METAKEY, true)` 로 meta data를 설정할 경우 editable 하지 않더라도 해당 transaction은 예외적으로 허용
   */
  static ALLOW_TRANSACTION_METAKEY = 'editorAllowTransaction' as const

  static isHTMLString(str: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/html')

    return !!doc.body.childElementCount
  }

  static initialState({
    content,
    schema,
    plugins,
  }: {
    content?: InitialEditorContent
    schema: Schema
    plugins?: Plugin[]
  }) {
    if (typeof content === 'object') {
      return EditorState.fromJSON({ schema, plugins }, content, Editor.getPluginFields(plugins))
    }

    return EditorState.create({
      schema,
      plugins,
      ...(content && { doc: Editor.getInitialDoc({ content, schema, plugins }) }),
    })
  }

  static getInitialDoc({
    content,
    schema,
    plugins,
  }: {
    content: InitialEditorContent
    schema: Schema
    plugins?: Plugin[]
  }) {
    try {
      if (typeof content === 'object') {
        return EditorState.fromJSON({ schema, plugins }, content, Editor.getPluginFields(plugins))
          .doc
      }

      if (Editor.isHTMLString(content)) {
        const minifyContent = content
          .trim()
          .split('\n')
          .map((v) => v.trim())
          .join('')

        const parser = new DOMParser()
        const doc = parser.parseFromString(minifyContent, 'text/html')

        return PmDOMParser.fromSchema(schema).parse(doc.body, { preserveWhitespace: true })
      }

      const fragment = document.createDocumentFragment()

      content
        .split('\n')
        .map((content) => {
          const p = document.createElement('p')
          p.textContent = content

          return p
        })
        .forEach((p) => fragment.append(p))

      return PmDOMParser.fromSchema(schema).parse(fragment, { preserveWhitespace: true })
    } catch (error) {
      console.error(error)

      return undefined
    }
  }

  /**
   * state.toJSON 매개변수 pluginFields (`{[propName: string]: Plugin;}`) 생성을 도와주는 유틸 함수
   */
  static getPluginFields(plugins?: readonly Plugin[]) {
    if (!plugins?.length) return undefined

    return plugins.reduce((fields, plugin) => {
      const fieldName = plugin.spec?.state
        ? /* @ts-ignore */
          (plugin.spec.key!.key as string).replace(/\$[0-9]*$/, '')
        : null

      return {
        ...fields,
        ...(fieldName && { [fieldName]: plugin }),
      }
    }, {})
  }

  constructor({
    state,
    view,
    content,
    extensions = [Document, Paragraph, Text],
    dom,
    onUpdate,
    ...config
  }: EditorConstructorProps) {
    const {
      editable = true,
      autoFocus = false,
      spellcheck = false,
      autoCompositionend = 1000,
    } = config

    this.#config = {
      editable,
      autoFocus,
      spellcheck,
      autoCompositionend,
    }

    this.#extensionManager = new ExtensionManager({ editor: this, extensions })

    const { schema, editorPlugins } = this.#extensionManager.integratePlugins()

    this.state =
      state ??
      Editor.initialState({
        content,
        schema,
        plugins: editorPlugins,
      })

    this.#updateObserver = new EditorUpdateObserver()

    if (onUpdate) {
      this.#updateObserver.observe(onUpdate)
    }

    if (this.#config.autoCompositionend) {
      this.#compositionDebounce = debounce((view, event) => {
        if (!view.composing) return
        if (!view.state.selection.empty) return
        if (this.#pressedHanjaMode) return

        view.dom.blur()
        view.focus()
      }, this.#config.autoCompositionend)
    }

    /**
     * keyup 핸들러
     * - 한자 키를 입력했는지에 대한 boolean 변수를 설정
     */
    const handleKeyup: (this: Editor, view: EditorView, event: KeyboardEvent) => boolean | void = (
      view,
      event,
    ) => {
      this.#pressedHanjaMode = event.key === 'HanjaMode'
    }

    this.#viewProps = {
      transformPastedHTML(html) {
        const result = html
          .replace(/class="[^"]*"/g, '')
          .replace(/style="[^"]*"/g, '')
          .replace(/<([^>]+)\s+>/g, (match, rest) => {
            return `<${rest.trim()}>`
          })

        return result
      },
      attributes: {
        class: 'ryan-editor',
      },
      editable: () => {
        return this.editable ?? this.#config.editable
      },
      handleDOMEvents: {
        ...(this.#compositionDebounce && {
          compositionupdate: this.#compositionDebounce,
        }),
        keyup: handleKeyup.bind(this),
      },
      dispatchTransaction: (tr) => {
        const view = this.view

        if (!view) return

        const editable = view.editable

        const changed: EditorChanged = {
          doc: tr.docChanged,
          selection: tr.selectionSet,
        }

        /*
          editable 하지 않을 경우(editable: false)
          - 드래그 등을 통한 선택범위(selection) 외 변경을 허용하지 않음
            - NodeSelection 허용하지 않음
          - {[Editor.ALLOW_TRANSACTION_METAKEY]: true} 의 meta 를 가지고 있는 transaction만 예외적으로 적용
        */
        if (!editable) {
          const allowTransaction = tr.getMeta(Editor.ALLOW_TRANSACTION_METAKEY)

          if (!allowTransaction) {
            if (!changed.selection) return
            if (isNodeSelection(tr.selection)) return
          }

          if (allowTransaction && allowTransaction !== true) return
        }

        const state = view.state.apply(tr)
        this.state = state
        view.updateState(state)

        this.#updateObserver.forEach({ changed, tr })
      },
    }

    if (dom) {
      dom.spellcheck = spellcheck
    }

    this.view =
      view ??
      new EditorView(dom ?? null, {
        state: this.state,
        ...this.#viewProps,
      })

    if (dom && this.#config.autoFocus) {
      this.view.focus()
    }
  }

  selectParent() {
    return selectParentNode(this.state, this.view.dispatch, this.view)
  }

  /**
   * command를 현재 editor state, dispatch, view 로 실행
   */
  resolvePlainCommand(command: Command, { focus }: { focus?: boolean } = {}) {
    if (focus) {
      this.focus()
    }

    return command(this.state, this.view.dispatch, this.view)
  }

  /**
   * - 비동기로 boolean을 반환하는 command(`(state:EditorState, dispatch?:(tr:Transaction) => void, view?: EditorView) => Promise<boolean>`)를 현재 editor state, dispatch, view 로 실행
   * - `focus: true` 인 경우, focus된 상태에서 커맨드 실행
   * @example
   * ```ts
   * const success = await editor.resolvePlainAsyncCommand(
   *   BlockImage.commands.uploadImage({
   *     source: 'https://img.icons8.com/?size=100&id=24895&format=png&color=000000',
   *     align: 'center',
   *   }),
   *   { focus: true },
   * )
   * ```
   */
  async resolvePlainAsyncCommand(
    asyncCommand: (...args: Parameters<Command>) => Promise<boolean>,
    { focus }: { focus?: boolean } = {},
  ) {
    if (focus) {
      this.focus()
    }

    return await asyncCommand(this.state, this.view.dispatch, this.view)
  }

  /**
   * - async command 로 추정되는 커맨드를 현재 editor state, dispatch, view 로 실행
   * - command 실행을 위한 인자가 있을 경우 전달해줘야 함
   * - 마지막 인자로 `_focus: true`를 전달할 경우, focus된 상태에서 커맨드 실행
   * @example
   * ```ts
   * const success = await editor.resolveAsyncCommand(
   *   BlockImage.commands.uploadImage,
   *   {
   *     source: 'https://img.icons8.com/?size=100&id=24895&format=png&color=000000',
   *     align: 'center',
   *   },
   *   { _focus: true },
   * )
   * ```
   */
  async resolveAsyncCommand<
    AsyncCommand extends
      | ((...args: any[]) => Promise<Command>)
      | ((
          ...args: any[]
        ) => (state: EditorState, dispatch?: Dispatch, view?: EditorView) => Promise<boolean>),
  >(asyncCommand: AsyncCommand, ...args: [...Parameters<AsyncCommand>]): Promise<boolean>
  async resolveAsyncCommand<
    AsyncCommand extends
      | ((...args: any[]) => Promise<Command>)
      | ((
          ...args: any[]
        ) => (state: EditorState, dispatch?: Dispatch, view?: EditorView) => Promise<boolean>),
  >(
    asyncCommand: AsyncCommand,
    ...args: [...Parameters<AsyncCommand>, { _focus: boolean }]
  ): Promise<boolean>
  async resolveAsyncCommand<
    AsyncCommand extends
      | ((...args: any[]) => Promise<Command>)
      | ((
          ...args: any[]
        ) => (state: EditorState, dispatch?: Dispatch, view?: EditorView) => Promise<boolean>),
  >(asyncCommand: AsyncCommand, ...args: any[]): Promise<boolean> {
    const maybeConfig = args.at(-1)
    const FOCUS_OPTION_FIELD_NAME = '_focus'

    const hasOption =
      isPlainObject(maybeConfig) &&
      Object.keys(maybeConfig).length === 1 &&
      FOCUS_OPTION_FIELD_NAME in maybeConfig &&
      typeof maybeConfig[FOCUS_OPTION_FIELD_NAME] === 'boolean'

    const params = hasOption ? args.slice(0, -1) : args

    if (hasOption && maybeConfig[FOCUS_OPTION_FIELD_NAME] === true) {
      this.focus()
    }

    const command = await asyncCommand(...params)

    if (typeof command === 'boolean') return command

    return command(this.state, this.view.dispatch, this.view)
  }

  hasPlugin<P extends Plugin>(plugin: P) {
    return !!this.state.plugins.find((_plugin) => _plugin.spec.key === plugin.spec.key)
  }

  reconfigurePlugins(plugins: Plugin<any>[]) {
    this.view.updateState(
      this.state.reconfigure({
        plugins: [...this.state.plugins, ...plugins],
      }),
    )
  }

  subscribeUpdateListener(updateCallback: EditorUpdateCallback) {
    this.#updateObserver.observe(updateCallback)

    return () => {
      this.#updateObserver.remove(updateCallback)
    }
  }

  get editable() {
    return this.view?.editable
  }

  /**
   * `editable` 수정
   *
   * 수정을 원하는 `editable`값과 현재 `editable` 값이 같을 경우 업데이트 하지 않음
   *
   * - `editable` 값을 직접 전달하여 수정
   * ```ts
   * setEditable(editable: boolean): void
   * ```
   *
   * - 현재 `editable` 값을 참조하여 수정
   * ```ts
   * setEditable(callback: (prev: boolean) => boolean): void
   * ```
   */
  setEditable(editable: boolean): void
  setEditable(callback: (prev: boolean) => boolean): void
  setEditable(valueOrCallback: boolean | ((prev: boolean) => boolean)) {
    if (typeof valueOrCallback === 'function') {
      const callbackFn = valueOrCallback

      const callbackReturnValue = callbackFn(this.editable)

      if (callbackReturnValue === this.editable) return

      this.view.setProps({
        editable() {
          return callbackReturnValue
        },
      })

      return
    }

    const editableValue = valueOrCallback

    if (editableValue === this.editable) return

    this.view.setProps({
      editable() {
        return editableValue
      },
    })
  }

  attachDOM<DOM extends HTMLElement>(
    dom: DOM,
    { spellcheck }: AttachDomOption = { spellcheck: false },
  ) {
    if (this.view.dom === dom) {
      return
    }

    dom.spellcheck = spellcheck

    const state = this.view.state

    this.view.destroy()

    this.view = new EditorView(
      { mount: dom },
      {
        state,
        ...this.#viewProps,
      },
    )

    if (this.#config.autoFocus) {
      this.view.focus()
    }
  }

  canCommand<TargetCommand extends SingleCommand>(
    command: TargetCommand,
    ...args: CanCommandParams<TargetCommand>
  ) {
    if (!this.view.editable) return false

    if (args?.length) {
      const targetCommand = command as RawCommand | MaybeExcuteCommand

      const execResult = targetCommand(...args)

      if (typeof execResult === 'boolean') {
        return execResult
      }

      return execResult(this.state)
    }

    return (command as Command)(this.state)
  }

  nodeIsSelected<T extends NodeType>(nodeType: T): boolean
  nodeIsSelected<T extends Node>(node: T): boolean
  nodeIsSelected<T extends Node | NodeType>(nodeOrType: T) {
    return isSelectedNode({ nodeOrType, selection: this.state.selection })
  }

  isActive<T extends NodeType>(type: T, attrs?: Attrs, opt?: { exactMatchAttrs?: boolean }): boolean
  isActive<T extends MarkType>(type: T, attrs?: Attrs): boolean
  isActive<T extends NodeType | MarkType>(
    type: T,
    attrs?: Attrs,
    opt?: { exactMatchAttrs?: boolean },
  ) {
    const state = this.state

    if (type instanceof NodeType) {
      return selectionHasNodeType({
        state,
        nodeType: type,
        attrs,
        exactMatchAttrs: opt?.exactMatchAttrs ?? true,
      })
    }

    return selectionHasMark({ state, type })
  }

  focus() {
    this.view.dom.focus()
  }

  blur() {
    this.view.dom.blur()
  }

  toText() {
    const content = this.view.state.doc.content

    return content.textBetween(0, content.size, '\n')
  }

  toJSON() {
    return this.view.state.toJSON(Editor.getPluginFields(this.state.plugins))
  }

  toHTML() {
    const doc = PmDOMSerializer.fromSchema(this.state.schema).serializeFragment(
      this.view.state.doc.content,
    )

    if (doc instanceof HTMLElement) {
      return doc.innerHTML
    }

    const temp = document.createElement('div')
    temp.append(doc)

    return temp.innerHTML
  }
}
