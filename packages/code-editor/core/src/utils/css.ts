import { camelToKebab } from './parse'

export const styleMapToText = (map: Record<string, string | number>) => {
  return Array.from(Object.entries(map))
    .map(([name, value]) => {
      return `${camelToKebab(name)}:${value}`
    })
    .join(';')
}

export const styleTextToMap = (styleText: string) => {
  return styleText
    .split(';')
    .map((t) => t.trim())
    .reduce(
      (acc, item) => {
        const [key, value] = item.split(':').map((str) => str.trim())

        if (key && value) {
          acc[key] = Number.isNaN(Number(value)) ? value : Number(value)
        }

        return acc
      },
      {} as Record<string, string | number>,
    )
}
