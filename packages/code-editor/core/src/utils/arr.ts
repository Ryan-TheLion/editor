export const flatten = <T>(array: Array<T>) => {
  let flattenedArray: T[] = []

  for (const item of array) {
    if (Array.isArray(item)) {
      flattenedArray = [...flattenedArray, ...flatten(item)]

      continue
    }

    flattenedArray = [...flattenedArray, item]
  }

  return flattenedArray
}

export const deepReplace = <T>(
  data: T[],
  {
    target,
    replace,
  }: {
    target: (value: T) => boolean
    replace: (value: T) => T
  },
): T[] => {
  return data.map((item) => {
    if (Array.isArray(item)) {
      return deepReplace(item, {
        target,
        replace,
      })
    }

    if (target(item)) {
      return replace(item)
    }

    return item
  }) as T[]
}
