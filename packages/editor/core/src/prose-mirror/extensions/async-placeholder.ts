import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { MergeConfigMap } from '../../typing'
import { Extension } from './core'

export type AsyncPlaceholderType = 'add' | 'remove' | 'replace' | 'tracking'

export type AsyncPlacehodlerPluginState = DecorationSet

export type AsyncPlaceholderActionPayload<Type extends AsyncPlaceholderType | null> =
  Type extends null
    ? {
        id?: string
        pos?: number
        widget?: HTMLElement
      }
    : Type extends 'add'
      ? {
          pos: number
          widget: HTMLElement
        }
      : Type extends 'remove'
        ? {
            id: string
          }
        : Type extends 'replace'
          ? {
              id: string
              widget: HTMLElement
            }
          : { pos: number }

export type AsyncPlaceholderAction<Type extends AsyncPlaceholderType | null = null> = {
  type: Type extends unknown ? AsyncPlaceholderType : Type
} & AsyncPlaceholderActionPayload<Type>

export interface AsyncPlaceholderUtils {
  /** transaction에서 async placeholder 와 관련된 metadata를 반환 */
  getAsyncPlacehodlerAction: (tr: Transaction) => AsyncPlaceholderAction | null
  /**
   * - async placeholder 와 관련된 tr 생성을 도와주는 유틸 함수
   * - `add , tracking action`: 생성된 id와 적용된 tr 반환
   * - `remove, replace action`: 적용된 tr 반환
   *
   * ```ts
   * // add action : pos 에 widget을 추가
   * {
   *   type: 'add'
   *   pos: number
   *   widget: HTMLElement
   * } => {id, tr}
   *
   * // tracking action
   * // - pos 에 width, height가 없는 inline-block 요소를 widget으로 추가
   * // - 시각적으로 보여주지는 않지만 이후에 추적된 위치를 활용하기 위해서 사용
   * {
   *   pos: number
   * } => {id, tr}
   *
   * // remove action : 해당 id를 가진 widget을 삭제
   * {
   *   type: 'remove'
   *   id: string
   * } => {tr}
   *
   * // replace action : 해당 id를 가진 widget을 교체
   * {
   *   type: 'replace'
   *   id: string
   *   widget: HTMLElement
   * } => {tr}
   * ```
   */
  setAsyncPlaceholderAction: <Type extends AsyncPlaceholderType>(
    tr: Transaction,
    action: AsyncPlaceholderAction<Type>,
  ) => Type extends 'add' | 'tracking' ? { tr: Transaction; id: string } : { tr: Transaction }
  /** 해당 id 의 widget(decoration)을 반환 */
  findAsyncPlaceholder: ({ state, id }: { state: EditorState; id: string }) => Decoration | null
  /** state에서 placeholder action 으로 적용된 decoration 반환 */
  getDecos: (state?: EditorState) => Decoration[] | null
  /** state의 pos 에서 placeholder action 으로 적용된 widget(decoration) 이 있는지 반환 */
  hasWidgetAtPos: (param?: { state?: EditorState; pos?: number }) => boolean
}

export const ASYNC_PLACE_HOLDER_NAME = 'async_placeholder' as const

export const ASYNC_PLACE_HOLDER_ACTION_KEY = 'asyncPlaceholderAction' as const

export const asyncPlacehodlerPluginKey = new PluginKey<AsyncPlacehodlerPluginState>(
  'asyncPlaceholderPlugin',
)

/**
 * async placeholder extension
 *
 * ```ts
 * type AsyncPlaceholderType = 'add' | 'remove' | 'replace' | 'tracking'
 *
 * const ASYNC_PLACE_HOLDER_ACTION_KEY = 'asyncPlaceholderAction'
 * ```
 *
 * - 이미지 업로드 등 (주로 비동기적인 작업)에서 widget을 적용하여 시각적으로 보여주는 것을 도와주는 extension
 *
 */
export const AsyncPlaceholder = Extension.create<
  MergeConfigMap<{
    name: typeof ASYNC_PLACE_HOLDER_NAME
    utils: AsyncPlaceholderUtils
  }>
>({
  name: ASYNC_PLACE_HOLDER_NAME,
  utils({ editor }) {
    return {
      getAsyncPlacehodlerAction(tr) {
        const meta = tr.getMeta(ASYNC_PLACE_HOLDER_ACTION_KEY)

        if (isAsyncPlaceholderAction(meta)) {
          return meta
        }

        return null
      },
      setAsyncPlaceholderAction(tr, action) {
        if (action.type === 'add' || action.type === 'tracking') {
          const id = globalThis.crypto.randomUUID()

          tr.setMeta(ASYNC_PLACE_HOLDER_ACTION_KEY, {
            ...action,
            ...((action.type === 'add' || action.type === 'tracking') && { id }),
          })

          return {
            id,
            tr,
          } as any
        }

        tr.setMeta(ASYNC_PLACE_HOLDER_ACTION_KEY, action)

        return {
          tr,
        }
      },
      findAsyncPlaceholder({ state, id }) {
        const decos = asyncPlacehodlerPluginKey.getState(state)

        const found = decos?.find(undefined, undefined, (spec) => spec.id === id)

        if (found?.length) {
          return found[0]!
        }

        return null
      },
      getDecos(state) {
        const editorState = state ?? editor.state

        const decos = asyncPlacehodlerPluginKey.getState(editorState)?.find()

        return decos?.length ? decos : null
      },
      hasWidgetAtPos({ state, pos } = {}) {
        const editorState = state ?? editor.state
        const targetPos = typeof pos === 'number' ? pos : editorState.selection.$from.pos

        const decorationSet = asyncPlacehodlerPluginKey.getState(editorState)

        const decoAtPos = decorationSet?.find(targetPos, targetPos)

        return !!decoAtPos?.length
      },
    }
  },
  plugins({ editor, utils }) {
    const plugin = new Plugin({
      key: asyncPlacehodlerPluginKey,
      state: {
        init() {
          return DecorationSet.empty
        },
        apply(tr, set) {
          set = set.map(tr.mapping, tr.doc)

          const action = utils.getAsyncPlacehodlerAction(tr)

          if (!action) return set

          const pos = ((action: AsyncPlaceholderAction) => {
            switch (action.type) {
              case 'add':
              case 'tracking': {
                return (
                  action as AsyncPlaceholderAction<'add'> | AsyncPlaceholderAction<'tracking'>
                ).pos
              }
              case 'remove':
              case 'replace': {
                const { id } = action as
                  | AsyncPlaceholderAction<'remove'>
                  | AsyncPlaceholderAction<'replace'>

                return utils.findAsyncPlaceholder({ state: editor.state, id })?.from
              }
            }
          })(action)

          const deco = ((pos?: number) => {
            if (typeof pos === 'number') {
              if (action.widget) {
                return Decoration.widget(pos, action.widget, { id: action.id, type: action.type })
              }

              if (action.type === 'tracking') {
                const trackingPlaceholder = document.createElement('div')
                trackingPlaceholder.style.cssText = `
                  display: inline-block;
                  width: 0;
                  height: 0;
                `

                return Decoration.widget(pos, trackingPlaceholder, {
                  id: action.id,
                  type: action.type,
                })
              }
            }

            return null
          })(pos)

          switch (action.type) {
            case 'add':
            case 'tracking': {
              if (deco) {
                set = set.add(tr.doc, [deco])
              }

              break
            }
            case 'remove': {
              set = set.remove(set.find(undefined, undefined, (spec) => spec.id === action.id))
              break
            }
            case 'replace': {
              if (deco) {
                set = set.remove(set.find(undefined, undefined, (spec) => spec.id === action.id))
                set = set.add(tr.doc, [deco])
              }

              break
            }
          }

          return set
        },
      },
      props: {
        decorations(state) {
          return this.getState(state)
        },
      },
    })

    return [plugin]
  },
})

// ---- internal util function ----

/**
 * transaction 의 meta 데이터에 대한 AsyncPlaceholderAction 타입 가드 함수
 * @internal
 */
function isAsyncPlaceholderAction(meta: any): meta is AsyncPlaceholderAction<any> {
  if (typeof meta !== 'object') return false
  if (!('type' in meta)) return false

  if (
    meta['type'] !== 'add' &&
    meta['type'] !== 'remove' &&
    meta['type'] !== 'replace' &&
    meta['type'] !== 'tracking'
  )
    return false

  if (!!meta['id'] && typeof meta['id'] !== 'string') return false

  return true
}
