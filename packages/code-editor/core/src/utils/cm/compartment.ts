import { Compartment, EditorState, StateEffect } from '@codemirror/state'
import { CompartmentInstance, CompartmentReconfigureEffect } from '../../typing'

export const compartmentHasExtension = ({
  compartment,
  state,
}: {
  compartment: Compartment
  state: EditorState
}) => {
  const ext = compartment.get(state)

  if (Array.isArray(ext)) return !!ext.length

  return !!ext
}

export const isCompartmentInstance = (target: any): target is CompartmentInstance => {
  if (typeof target !== 'object') return false

  if (!('compartment' in target) || !(target.compartment instanceof Compartment)) return false
  if (!('inner' in target)) return false

  return true
}

export const isCompartmentReconfigureEffect = (
  effect: StateEffect<any>,
): effect is CompartmentReconfigureEffect => {
  if (typeof effect.value !== 'object') return false

  if (!('compartment' in effect.value) || !(effect.value.compartment instanceof Compartment))
    return false
  if (!('extension' in effect.value)) return false

  return true
}
