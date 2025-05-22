import { Command } from '@codemirror/view'
import { AsyncFunction, RegularFunction } from '../typing'
import { getParameterNames } from './parse'

export const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export const isAsyncFunction = (fn: AsyncFunction | RegularFunction): fn is AsyncFunction => {
  return fn.constructor.name === 'AsyncFunction'
}

export const isCodeMirrorCommand = (fn: any): fn is Command => {
  if (typeof fn !== 'function') return false

  const params = getParameterNames(fn)

  if (!params.length) return false
  if (params.length > 1) return false

  const param = params[0]

  return param === 'view' || param === '{ state, dispatch }'
}
