import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginSpec,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view'
import { Tree } from '@lezer/common'
import { themeModeChanged } from './theme/editor-theme'

const SYNTAX_TREE_TIMEOUT = 1000 * 5 // ms

export type SyntaxTreePluginConstructor = new (view: EditorView) => SyntaxTreePlugin

type SyntaxTreePluginFunctionConstructor = (view: EditorView) => SyntaxTreePlugin

export const syntaxTreeViewPlugin = (
  treePlugin: SyntaxTreePluginConstructor | SyntaxTreePluginFunctionConstructor,
  spec?: PluginSpec<SyntaxTreeViewPlugin>,
) => {
  return ViewPlugin.define((view) => {
    if (
      treePlugin === SyntaxTreePlugin ||
      /^class\s/.test(Function.prototype.toString.call(treePlugin))
    ) {
      return new SyntaxTreeViewPlugin(view, new (treePlugin as SyntaxTreePluginConstructor)(view))
    }

    const plugin = (treePlugin as SyntaxTreePluginFunctionConstructor)(view)

    return new SyntaxTreeViewPlugin(view, plugin)
  }, spec)
}

class SyntaxTreeViewPlugin {
  #view: EditorView

  treePlugin: SyntaxTreePlugin

  decorations: DecorationSet

  private static treeMap: Map<HTMLElement, Tree> = new Map()

  constructor(view: EditorView, treePlugin: SyntaxTreePlugin) {
    this.#view = view
    this.treePlugin = treePlugin

    this.decorations = Decoration.none

    const { tree, shouldSetToMap }: { tree: Tree; shouldSetToMap: boolean } = (() => {
      const currentTree = SyntaxTreeViewPlugin.treeMap.get(this.view.dom)

      if (currentTree)
        return {
          tree: currentTree,
          shouldSetToMap: false,
        }

      let initialSyntaxTree: Tree | null

      while (true) {
        initialSyntaxTree = ensureSyntaxTree(
          this.view.state,
          this.view.state.doc.length,
          SYNTAX_TREE_TIMEOUT,
        )

        break
      }

      return {
        tree: initialSyntaxTree ?? syntaxTree(this.view.state),
        shouldSetToMap: true,
      }
    })()

    if (shouldSetToMap) {
      SyntaxTreeViewPlugin.treeMap.set(this.view.dom, tree)
    }

    this.treePlugin.onInit?.(this.tree)

    this.decorations = this.treePlugin.getDecorations({
      tree: this.tree,
      currentDecorations: this.decorations,
    })
  }

  update(update: ViewUpdate) {
    this.#view = update.view
    this.treePlugin.view = update.view

    const shouldUpdateTree = this.#shouldUpdateTree(update)

    if (shouldUpdateTree) {
      SyntaxTreeViewPlugin.treeMap.set(this.view.dom, syntaxTree(update.state))
    }

    if (
      !this.treePlugin.canUpdate({
        tree: this.tree,
        viewUpdate: update,
        updatedTree: shouldUpdateTree,
      })
    )
      return

    this.treePlugin.onUpdate?.(this.tree, update)

    this.decorations = this.treePlugin.getDecorations({
      tree: this.tree,
      currentDecorations: this.decorations,
    })
  }

  destroy() {
    SyntaxTreeViewPlugin.treeMap.delete(this.view.dom)

    this.treePlugin.onDestroy?.()
  }

  get view() {
    return this.#view
  }

  get tree() {
    return this.#getTree()
  }

  #getTree() {
    return SyntaxTreeViewPlugin.treeMap.get(this.view.dom)!
  }

  #shouldUpdateTree = (update: ViewUpdate) => {
    return update.docChanged || update.viewportMoved || themeModeChanged(update)
  }
}

export abstract class SyntaxTreePlugin {
  view: EditorView

  constructor(view: EditorView) {
    this.view = view
  }

  /**
   * (Optional)
   * SyntaxTreeViewPlugin 생성시 호출 됨
   */
  onInit(tree: Tree): void {}

  /**
   * (Optional)
   * view 가 업데이트 될 때 호출 됨
   * - `canUpdate` 함수 반환 값이 false 인 경우 호출되지 않음
   */
  onUpdate(tree: Tree, update: ViewUpdate): void {}

  /**
   * `true`인 경우
   * - `onUpdate` 메소드 호출
   * - `getDecorations` 반환 값으로 decorations 업데이트,
   *
   * (syntax tree에 대한 업데이트 유무를 반환하는 것이 아님)
   */
  abstract canUpdate({
    tree,
    viewUpdate,
    updatedTree,
  }: {
    tree: Tree
    viewUpdate: ViewUpdate
    updatedTree: boolean
  }): boolean

  /**
   * (Optional)
   * view 가 destroy 될 때 호출 됨
   */
  onDestroy(): void {}

  abstract getDecorations({
    tree,
    currentDecorations,
  }: {
    tree: Tree
    currentDecorations: DecorationSet
  }): DecorationSet
}
