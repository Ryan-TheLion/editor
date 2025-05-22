import { Facet } from '@codemirror/state'

export type FacetInput<F extends Facet<any, any>> = F extends Facet<infer I, infer O> ? I : any

export type FacetOutPut<F extends Facet<any, any>> = F extends Facet<infer I, infer O> ? O : any
