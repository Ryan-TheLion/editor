import { CamelCaseToKebabCase } from '../typing'

/**
 *
 * @example
 * ``` ts
 * camelToKebab('fontSize') // 'font-size'
 * camelToKebab('HelloWorld') // 'hello-world'
 * camelToKebab('kebab-case') // 'kebab-case'
 * ```
 */
export const camelToKebab = <Str extends string>(str: Str): CamelCaseToKebabCase<Str> => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() as CamelCaseToKebabCase<Str>
}

export const parseArrayFromFontsValueIterator = (iterator: SetIterator<FontFace>) => {
  const fonts: FontFace[] = []

  let fontResult = iterator.next()
  while (!fontResult.done) {
    fonts.push(fontResult.value)

    fontResult = iterator.next()
  }

  return fonts
}

export function getParameterNames(fn: Function): string[] {
  try {
    const fnStr = fn.toString().replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')

    const arrowFnMatch = fnStr.match(/^\s*(?:async\s*)?(?:\(?\s*([^)]*)\)?\s*=>)/)
    const regularFnMatch = fnStr.match(/^\s*(?:async\s*)?function\s*(?:\w+)?\s*\(\s*([^)]*)\)/)

    const params = arrowFnMatch?.[1] || regularFnMatch?.[1] || ''

    if (!params.trim()) {
      return []
    }

    const paramList: string[] = []

    const regex = /\s*(\{[^}]*\}|[^,]+)(?:,|$)/g
    let match

    while ((match = regex.exec(params))) {
      let param = match[1]?.trim() ?? ''

      if (!param.startsWith('{')) {
        param = param
          .replace(/:[^=,]+(?=($|=|,))/g, '')
          .replace(/=.*$/, '')
          .trim()
      }

      paramList.push(param)

      if (match.index + match[0].length >= params.length) {
        break
      }
    }

    return paramList
  } catch (error) {
    return []
  }
}
