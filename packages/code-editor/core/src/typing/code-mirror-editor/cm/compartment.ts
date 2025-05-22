import { Compartment, Extension, StateEffect } from '@codemirror/state'

export interface CompartmentInstance {
  compartment: Compartment
  inner: Extension
}

export type CompartmentReconfigureEffect = StateEffect<{
  compartment: Compartment
  extension: Extension
}>
