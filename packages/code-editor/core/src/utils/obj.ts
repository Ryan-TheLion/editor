import { isObject } from './is'

export const flattenObject = <T extends object>(
  obj: T,
  {
    prefix = '',
    seperator = '.',
    parseKey,
  }: { prefix?: string; seperator?: string; parseKey?: (key: string) => string } = {},
) => {
  return Object.entries(obj).reduce<Record<string, any>>((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}${seperator}${key}` : key

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        acc,
        flattenObject(value, {
          prefix: newKey,
          seperator,
          parseKey,
        }),
      )
    } else {
      acc[parseKey ? parseKey(newKey) : newKey] = value
    }

    return acc
  }, {})
}

export const overrideObject = <Target extends {}, Source>(
  target: Target,
  source: Source,
): Target & Source => {
  if (!source || !Object.keys(source).length) return target as Target & Source

  return Array.from(Object.entries(source)).reduce(
    (override, [key, value]) => {
      if (key in target) {
        return {
          ...override,
          [key]: {
            ...override[key as keyof Target],
            ...(value as Source),
          },
        }
      }

      return {
        ...override,
        [key]: value,
      }
    },
    { ...target } as Target & Source,
  ) as Target & Source
}

export const isEqual = (value: any, other: any) => {
  if (value === other) {
    return true
  }

  if (value == null || other == null) {
    return value === other
  }

  if (Number.isNaN(value) && Number.isNaN(other)) {
    return true
  }

  if (typeof value !== typeof other) {
    return false
  }

  if (Array.isArray(value) && Array.isArray(other)) {
    if (value.length !== other.length) return false

    for (let i = 0; i < value.length; i++) {
      if (!isEqual(value[i], other[i])) return false
    }

    return true
  }

  if (isObject(value) && isObject(other)) {
    const keysOfValue = Object.keys(value)
    const keysOfOther = Object.keys(other)

    if (keysOfValue.length !== keysOfOther.length) return false

    for (const key of keysOfValue) {
      if (!(key in other) || !isEqual(value[key], other[key])) {
        return false
      }
    }

    return true
  }

  return false
}

export const createProxyObject = <T extends Record<any, any>>({
  initial,
  onCreated,
  onChange,
}: {
  initial: T
  onCreated?: (initialObject: T) => void
  onChange: ({
    key,
    oldValue,
    value,
  }: {
    key: keyof T
    oldValue: T[keyof T]
    value: T[keyof T]
    target: T
  }) => void
}): T => {
  const proxyObject = new Proxy(initial, {
    set(target, key, value) {
      const oldValue = target[key as keyof T]

      if (value !== oldValue) {
        onChange({ key, oldValue, value, target })
      }

      target[key as keyof T] = value

      return true
    },
  })

  onCreated?.(proxyObject)

  return proxyObject
}
