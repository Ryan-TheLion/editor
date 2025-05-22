import { Node } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { EmptyExtensionConfigMap } from '../../typing'
import { maybeEmptyNode } from '../utils'
import { asyncPlacehodlerPluginKey } from './async-placeholder'
import { Extension } from './core'

export interface PlaceholderPluginState {
  decorations: DecorationSet
}

export interface PlaceholderOptions {
  /**
   * placeholder 문자열
   * - 기본값 `'내용을 입력해주세요'`
   */
  placeholder?: string
}

export const DEFAULT_PLACEHOLDER = '내용을 입력해주세요'

export const PLACE_HOLDER_NAME = 'placeholder'

export const placeholderPluginKey = new PluginKey<PlaceholderPluginState>('placeholderPlugin')

/**
 * placeholder extension
 *
 * - 플러그인 (`Plugin`)
 *   - 에디터 내용이 빈 텍스트인 경우 placeholder 문자열을 렌더링
 *
 */
export const Placeholder = Extension.create<
  EmptyExtensionConfigMap<typeof PLACE_HOLDER_NAME>,
  PlaceholderOptions
>({
  name: PLACE_HOLDER_NAME,
  options: {
    placeholder: DEFAULT_PLACEHOLDER,
  },
  plugins({ editor, options: { placeholder = DEFAULT_PLACEHOLDER } }) {
    const createPlaceholderElement = (placeholderText: string) => {
      const placeholderElement = document.createElement('div')
      placeholderElement.className = 'placeholder'
      placeholderElement.textContent = placeholderText || DEFAULT_PLACEHOLDER

      return placeholderElement
    }

    const placeholderDecorations = ({ empty, doc }: { empty: boolean; doc: Node }) => {
      return empty
        ? DecorationSet.create(doc, [
            Decoration.widget(2, createPlaceholderElement(placeholder), { type: 'placeholder' }),
          ])
        : DecorationSet.empty
    }

    const placehodlerPlugin = new Plugin<PlaceholderPluginState>({
      key: placeholderPluginKey,
      state: {
        init(config, state) {
          if (!editor.config.editable) {
            return {
              decorations: DecorationSet.empty,
            }
          }

          const maybeEmpty = maybeEmptyNode(state.doc)

          return {
            decorations: placeholderDecorations({ empty: maybeEmpty, doc: state.doc }),
          }
        },
        apply(tr, set, oldState, newState) {
          const maybeEmpty = maybeEmptyNode(tr.doc)
          const hasAsyncDeco = !!asyncPlacehodlerPluginKey.getState(newState)?.find().length

          const empty = maybeEmpty && !hasAsyncDeco

          return {
            decorations: placeholderDecorations({ empty, doc: tr.doc }),
          }
        },
      },
      props: {
        attributes(state) {
          return {
            ...(editor.view?.editable &&
              placeholderPluginKey.getState(state)?.decorations?.find().length && {
                ['aria-placeholder']: placeholder,
              }),
          }
        },
        decorations(state) {
          return this.getState(state)?.decorations
        },
      },
    })

    return [placehodlerPlugin]
  },
})
