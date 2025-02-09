import { Command } from 'prosemirror-state'

import { MergeConfigMap, PositiveSize, SizeUnit } from '../../../typing'
import { hasAttrInSelectionMarks } from '../../utils'
import { Extension, MarkExtension } from '../core'
import { TextStyle } from './text-style'

type FontSizeAttr<Size extends number | string> = {
  fontSize: ValidFontSize<Size>
}

export type ValidFontSize<Size extends number | string> = PositiveSize<Size, SizeUnit>

export type ValidFontSizes<Sizes extends (number | string)[]> = ValidFontSize<Sizes[number]>

export interface FontSizeCommands {
  /** 폰트 크기 설정 */
  setFontSize: <S extends number | string>(size: ValidFontSize<S>) => Command
  /** 폰트 크기 제거(초기화) */
  unsetFontSize: Command
  /** 폰트 크기가 적용되있을 경우 폰트 크기 제거, 적용 되있지 않은 경우 폰트 크기 설정 */
  toggleFontSize: <S extends number | string>(size: ValidFontSize<S>) => Command
}

export interface FontSizeUtils {
  /**
   * - size 값을 제공할 경우 해당 size 값을 가지는 폰트 크기 mark 가 있는지 유무
   * - size 값을 제공하지 않을 경우 폰트 크기 mark 가 있는지 유무
   */
  hasFontSize: <S extends number | string>(size?: ValidFontSize<S>) => boolean
  /** 폰트 크기 mark 속성 생성을 도와주는 유틸 함수 */
  createAttr: <S extends number | string>(size: ValidFontSize<S>) => FontSizeAttr<S>
}

export interface FontSizeOption {
  /**
   * - 적용할 폰트 크기 css 단위
   * - 기본값 `px`
   */
  unit?: SizeUnit
}

export const FONT_SIZE_NAME = 'font_size'

export const FONT_SIZE_ATTRIBUTE_NAME = 'fontSize'

export const DEFAULT_FONT_SIZE_UNIT: SizeUnit = 'px'

/**
 * 폰트 크기(`font-size`) mark extension
 *
 * ```ts
 * type SizeUnit = 'px' | 'em' | 'rem'
 *
 * type ValidFontSize<Size extends number | string> = PositiveSize<Size, SizeUnit>
 * ```
 *
 * - 인라인 스타일 (ex.`{font-size: '16px'}`) 로 적용 됨
 */
export const FontSize = Extension.create<
  MergeConfigMap<{
    name: typeof FONT_SIZE_NAME
    commands: FontSizeCommands
    utils: FontSizeUtils
  }>,
  FontSizeOption
>({
  name: 'font_size',
  options: {
    unit: DEFAULT_FONT_SIZE_UNIT,
  },
  attributeSpec({ options }) {
    return [
      MarkExtension.createDynamicAttribute({
        extensions: [TextStyle.name],
        attributes: {
          [FONT_SIZE_ATTRIBUTE_NAME]: {
            default: null,
            validate: 'string|number|null',
            styleRules: [
              {
                style: 'font-size',
                consuming: false,
                getAttrs(styleValue) {
                  return styleValue || null
                },
              },
            ],
            parseDOM(dom, matchedStyle) {
              if (typeof dom === 'string') {
                return matchedStyle === 'font-size' ? dom : null
              }

              return dom.style.fontSize || null
            },
            toDOM(mark) {
              const fontSizeAttr = mark.attrs[FONT_SIZE_ATTRIBUTE_NAME]

              return fontSizeAttr
                ? {
                    style: `font-size: ${typeof fontSizeAttr === 'number' ? `${Number(fontSizeAttr)}${options.unit || DEFAULT_FONT_SIZE_UNIT}` : fontSizeAttr}`,
                  }
                : null
            },
          },
        },
      }),
    ]
  },
  commands({ utils }) {
    return {
      setFontSize(size) {
        return TextStyle.commands.setTextStyle(FONT_SIZE_ATTRIBUTE_NAME, size)
      },
      unsetFontSize: TextStyle.commands.unsetTextStyle(FONT_SIZE_ATTRIBUTE_NAME),
      toggleFontSize(size) {
        if (utils.hasFontSize(size)) {
          return this.unsetFontSize
        }

        return this.setFontSize(size)
      },
    }
  },
  utils({ editor }) {
    return {
      hasFontSize(size) {
        return hasAttrInSelectionMarks({
          state: editor.state,
          key: FONT_SIZE_ATTRIBUTE_NAME,
          ...(size && { value: size }),
        })
      },
      createAttr(size) {
        return {
          [FONT_SIZE_ATTRIBUTE_NAME]: size,
        }
      },
    }
  },
})
