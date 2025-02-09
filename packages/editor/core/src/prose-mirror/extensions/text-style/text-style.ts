import { Mark } from 'prosemirror-model'
import { Command } from 'prosemirror-state'

import { MergeConfigMap } from '../../../typing'
import { setMark, unsetMark } from '../../utils'
import { MarkExtension } from '../core'

export interface TextStyleCommands {
  /** `TextStyle` mark attrs에 해당 key와 attr를 값으로 가지는 속성을 설정 */
  setTextStyle: (key: string, attr: any) => Command
  /** `TextStyle` mark attrs에서 해당 key에 해당하는 속성을 삭제 */
  unsetTextStyle: (key: string) => Command
  /** `TextStyle` mark 삭제 */
  clearTextStyle: Command
}

export interface TextStyleUtils {
  /** `TextStyle` mark 속성에 해당 key가 존재하는지 유무 */
  hasAttr: (key: string) => boolean
  /** `TextStyle` mark 이지만, 적용할 attr 가 없는지 (attrs = `{}` 이거나 속성 값이 모두 `null`) 유무  */
  hasEmptyTextStyle: (mark: Mark) => boolean
}

export const TEXT_STYLE_NAME = 'text_style' as const

/**
 * 텍스트와 관련된 스타일(font-size, color, ...)을 통합해서 관리하기 위한 mark extension
 * - `<span>` 태그로 적용 됨
 * - 병합하고 싶은 스타일이 있을 경우 `TextStyle` extension에 dynamic attrs 가 적용될 수 있도록 설정
 * @example
 * ```ts
 * Extension.create({
 *   ...,
 *   attributeSpec() {
 *     return [
 *       MarkExtension.createDynamicAttribute({
 *         extensions: [TextStyle.name],
 *         attributes: {
 *           [FONT_SIZE_ATTRIBUTE_NAME]: {
 *            default: null,
 *            validate: 'string|number|null',
 *            styleRules: [
 *              {
 *                style: 'font-size',
 *                consuming: false,
 *                getAttrs(styleValue) {
 *                  return styleValue || null
 *                },
 *              },
 *            ],
 *            parseDOM(dom, matchedStyle) {
 *              if (typeof dom === 'string') {
 *                return matchedStyle === 'font-size' ? dom : null
 *              }
 *
 *              return dom.style.fontSize || null
 *            },
 *            toDOM(mark) {
 *              const fontSizeAttr = mark.attrs[FONT_SIZE_ATTRIBUTE_NAME]
 *
 *              return fontSizeAttr
 *                ? {
 *                    style: `font-size: ${typeof fontSizeAttr === 'number' ? `${Number(fontSizeAttr)}${options.unit || DEFAULT_FONT_SIZE_UNIT}` : fontSizeAttr}`,
 *                  }
 *                : null
 *            },
 *          },
 *         }
 *       })
 *     ]
 *   },
 *   ...
 * })
 *
 * ```
 */
export const TextStyle = MarkExtension.create<
  MergeConfigMap<{
    name: typeof TEXT_STYLE_NAME
    commands: TextStyleCommands
    utils: TextStyleUtils
  }>
>({
  name: TEXT_STYLE_NAME,
  priority: 51,
  markSpec() {
    return {
      group: 'inline',
      content: 'inline*',
      attrs: {},
      parseDOM: [
        {
          tag: 'span',
          getAttrs(dom) {
            return dom.getAttribute('style') ? {} : false
          },
        },
      ],
      toDOM(mark, inline, attributes) {
        return ['span', attributes, 0]
      },
    }
  },
  commands({ markType, utils }) {
    return {
      setTextStyle(key, attr) {
        return (state, dispatch, view) => {
          if (!utils.hasAttr(key)) return false

          return setMark({ markType, attrs: { [key]: attr } }, (mark) =>
            utils.hasEmptyTextStyle(mark),
          )(state, dispatch, view)
        }
      },
      unsetTextStyle(key) {
        return this.setTextStyle(key, null)
      },
      clearTextStyle: unsetMark(markType),
    }
  },
  utils({ editor, markType }) {
    return {
      hasAttr(key) {
        const attrs = markType.spec.attrs

        if (!attrs) return false

        return key in attrs
      },
      hasEmptyTextStyle(mark) {
        if (mark.type.name !== markType.name) return false
        if (!markType.spec.attrs || !Object.keys(markType.spec.attrs).length) return true

        let misMatch: boolean = false

        for (const key in mark.attrs) {
          if (mark.attrs[key] !== null) {
            misMatch = true
            break
          }
        }

        return !misMatch
      },
    }
  },
})
