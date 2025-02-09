import { Attrs, Node } from 'prosemirror-model'
import { Command } from 'prosemirror-state'

import { CssColor, MergeConfigMap } from '../../../typing'
import { hasAttrInSelectionMarks } from '../../utils'
import { Extension, MarkExtension } from '../core'
import { TEXT_STYLE_NAME, TextStyle } from './text-style'

type MergeFontColorAttrs<
  Color extends string,
  ExtraAttrs extends Attrs = {},
> = ValidFontColorAttrs<Color> & ExtraAttrs

type ValidFontColorAttrs<Color extends string> = {
  color: CssColor<Color>
}

type FontColorAttrs = {
  color: string | null
}

interface FontColorNode {
  node: Node
  parent: Node | null
  pos: number
  color: string
}

export interface FontColorCommands {
  /** 폰트 색상 설정 */
  setFontColor: (color: string) => Command
  /** 폰트 색상 제거(초기화) */
  unsetFontColor: Command
  /** color 가 적용되있을 경우 폰트 색상 제거, 적용 되있지 않은 경우 폰트 색상 설정 */
  toggleFontColor: (color: string) => Command
}

export interface FontColorUtils {
  /**
   * - selection에서 `font_color` mark를 가지고 있는 노드들을
   *
   * ```ts
   *   {
   *     node: Node
   *     parent: Node | null
   *     pos: number
   *     color: string
   *   }
   * ```
   * 로 변환한 값을 가지는 배열
   *
   * - 없을 경우 `null` 리턴
   */
  getNodesWithFontColor: () => FontColorNode[] | null
  /**
   * - color 값이 없을 경우 color mark가 있는지에 대해 반환하고,
   * - color 값이 있을 경우 color mark 가 있고 해당 값이 color 와 같은지 반환
   */
  hasFontColor: (color?: string) => boolean
  /** attr 생성을 도와주는 유틸 함수 */
  mergeAttribute: <Color extends string, ExtraAttrs extends Attrs = {}>(
    attrs: MergeFontColorAttrs<Color, ExtraAttrs>,
  ) => Omit<ExtraAttrs, keyof FontColorAttrs> & ValidFontColorAttrs<Color>
}

export const FONT_COLOR_NAME = 'font_color'

export const FONT_COLOR_ATTRIBUTE_NAME = 'color'

/**
 * 폰트 색상(`color`) mark extension
 *
 * ```ts
 * const FONT_COLOR_ATTRIBUTE_NAME = 'color'
 * ```
 *
 * - 인라인 스타일 (ex.`{color: '#000000'}`) 로 적용 됨
 */
export const FontColor = Extension.create<
  MergeConfigMap<{
    name: typeof FONT_COLOR_NAME
    commands: FontColorCommands
    utils: FontColorUtils
  }>
>({
  name: FONT_COLOR_NAME,
  attributeSpec() {
    return [
      MarkExtension.createDynamicAttribute({
        extensions: [TEXT_STYLE_NAME],
        attributes: {
          [FONT_COLOR_ATTRIBUTE_NAME]: {
            default: null,
            validate: 'string|null',
            styleRules: [
              {
                style: 'color',
                consuming: false,
                getAttrs(styleValue) {
                  return styleValue || null
                },
              },
            ],
            parseDOM(dom, matchedStyle) {
              if (typeof dom === 'string') {
                return matchedStyle === 'color' ? dom : null
              }

              return dom.style.color || null
            },
            toDOM(mark) {
              const fontColorAttr = mark.attrs[FONT_COLOR_ATTRIBUTE_NAME]

              return fontColorAttr ? { style: `color: ${fontColorAttr}` } : null
            },
          },
        },
      }),
    ]
  },
  commands({ utils }) {
    return {
      setFontColor(color) {
        return TextStyle.commands.setTextStyle(FONT_COLOR_ATTRIBUTE_NAME, color)
      },
      unsetFontColor: TextStyle.commands.unsetTextStyle(FONT_COLOR_ATTRIBUTE_NAME),
      toggleFontColor(color) {
        if (utils.hasFontColor(color)) {
          return this.unsetFontColor
        }

        return this.setFontColor(color)
      },
    }
  },
  utils({ editor }) {
    return {
      getNodesWithFontColor() {
        const { $from, $to } = editor.state.selection

        const nodes: FontColorNode[] = []

        editor.state.doc.nodesBetween($from.pos, $to.pos, (node, pos, parent) => {
          const nodesWithFontColor: FontColorNode[] = node.marks
            .filter(
              (mark) =>
                mark.type === TextStyle.markType && mark.attrs[FONT_COLOR_ATTRIBUTE_NAME] !== null,
            )
            .map((mark) => ({
              node,
              parent,
              pos,
              color: mark.attrs.color,
            }))

          if (nodesWithFontColor?.length) {
            nodes.push(...nodesWithFontColor)
          }
        })

        return nodes.length ? [...nodes] : null
      },
      hasFontColor(color?: string) {
        return hasAttrInSelectionMarks({
          state: editor.state,
          key: FONT_COLOR_ATTRIBUTE_NAME,
          ...(color && { value: color }),
        })
      },
      mergeAttribute({ color, ...attrs }) {
        return {
          color: color,
          ...attrs,
        }
      },
    }
  },
})
