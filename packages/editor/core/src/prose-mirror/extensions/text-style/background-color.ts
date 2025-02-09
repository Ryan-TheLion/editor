import { Attrs } from 'prosemirror-model'
import { Command } from 'prosemirror-state'

import { CssColor, MergeConfigMap } from '../../../typing'
import { hasAttrInSelectionMarks } from '../../utils'
import { Extension, MarkExtension } from '../core'
import { TEXT_STYLE_NAME, TextStyle } from './text-style'

type MergeBackgroundColorAttrs<
  Color extends string,
  ExtraAttrs extends Attrs = {},
> = ValidBackgroundColorAttrs<Color> & ExtraAttrs

type ValidBackgroundColorAttrs<Color extends string> = {
  backgroundColor: CssColor<Color>
}

export type BackgroundColorAttrs = {
  backgroundColor: string | null
}

export interface BackgroundCommands {
  /** 배경 색상 설정 */
  setBackgroundColor: (color: string) => Command
  /** 배경 색상 제거 */
  unsetBackgroundColor: Command
  /** 배경 색상이 적용되있을 경우 배경 색상 제거, 적용 되있지 않은 경우 배경 색상 설정 */
  toggleBackgroundColor: (color: string) => Command
}

export interface BackgroundColorUtils {
  /**
   * backgroundColor 속성 값을 포함한 attrs 생성을 도와 주는 유틸 함수
   * @example
   * ```ts
   * BackgroundColor.utils.mergeAttribute({color: '#000000', ...rest})
   * // attrs { backgroundColor: '#000000', ...rest}
   * ```
   */
  mergeAttribute: <Color extends string, ExtraAttrs extends Attrs = {}>(
    attrs: MergeBackgroundColorAttrs<Color, ExtraAttrs>,
  ) => Omit<ExtraAttrs, keyof BackgroundColorAttrs> & ValidBackgroundColorAttrs<Color>
  /**
   * - color 값이 없을 경우 background color mark가 있는지에 대해 반환하고,
   * - color 값이 있을 경우 background color mark 가 있고 해당 값이 color 와 같은지 반환
   */
  hasBackgroundColor: (color?: string) => boolean
}

export const BACKGROUND_COLOR_NAME = 'background_color'

export const BACKGROUND_COLOR_ATTRIBUTE_NAME = 'backgroundColor'

/**
 * 배경 색상(`background-color`) mark extension
 *
 * ```ts
 * const BACKGROUND_COLOR_ATTRIBUTE_NAME = 'backgroundColor'
 * ```
 *
 * - 인라인 스타일 (ex.`{background-color: '#000000'}`) 로 적용 됨
 */
export const BackgroundColor = Extension.create<
  MergeConfigMap<{
    name: typeof BACKGROUND_COLOR_NAME
    commands: BackgroundCommands
    utils: BackgroundColorUtils
  }>
>({
  name: BACKGROUND_COLOR_NAME,
  attributeSpec() {
    return [
      MarkExtension.createDynamicAttribute({
        extensions: [TEXT_STYLE_NAME],
        attributes: {
          [BACKGROUND_COLOR_ATTRIBUTE_NAME]: {
            default: null,
            validate: 'string|null',
            styleRules: [
              {
                style: 'background-color',
                consuming: false,
                getAttrs(styleValue) {
                  return styleValue || null
                },
              },
            ],
            parseDOM(dom, matchedStyle) {
              if (typeof dom === 'string') {
                return matchedStyle === 'background-color' ? dom : null
              }

              return dom.style.backgroundColor || null
            },
            toDOM(mark) {
              const backgroundColorAttr = mark.attrs[BACKGROUND_COLOR_ATTRIBUTE_NAME]

              return backgroundColorAttr
                ? { style: `background-color: ${backgroundColorAttr}` }
                : null
            },
          },
        },
      }),
    ]
  },
  commands({ editor, utils }) {
    return {
      setBackgroundColor(color) {
        return TextStyle.commands.setTextStyle(BACKGROUND_COLOR_ATTRIBUTE_NAME, color)
      },
      unsetBackgroundColor: TextStyle.commands.unsetTextStyle(BACKGROUND_COLOR_ATTRIBUTE_NAME),
      toggleBackgroundColor(color) {
        if (utils.hasBackgroundColor(color)) {
          return this.unsetBackgroundColor
        }

        return this.setBackgroundColor(color)
      },
    }
  },
  utils({ editor }) {
    return {
      hasBackgroundColor(color) {
        return hasAttrInSelectionMarks({
          state: editor.state,
          key: BACKGROUND_COLOR_ATTRIBUTE_NAME,
          ...(color && { value: color }),
        })
      },
      mergeAttribute({ backgroundColor, ...attrs }) {
        return {
          backgroundColor: backgroundColor,
          ...attrs,
        }
      },
    }
  },
})
