import { Facet } from '@codemirror/state'
import { ViewUpdate } from '@codemirror/view'
import { FacetOutPut } from '../../typing'

type FacetChanged<FacetMap extends Record<any, Facet<any, any>>> = {
  [Key in keyof FacetMap]: {
    changed: boolean
    value: {
      prev: FacetOutPut<FacetMap[Key]>
      current: FacetOutPut<FacetMap[Key]>
    }
  }
}

export const facetChanged = <FacetMap extends Record<any, Facet<any, any>>>(
  { startState, state }: Pick<ViewUpdate, 'startState' | 'state'>,
  facets: FacetMap,
): FacetChanged<FacetMap> => {
  return Array.from(Object.keys(facets)).reduce((result, key) => {
    const targetKey = key as keyof FacetMap

    const targetFacet = facets[targetKey]!

    const prev = startState.facet(targetFacet.reader)
    const current = state.facet(targetFacet.reader)

    result[targetKey] = {
      changed: prev !== current,
      value: {
        prev,
        current,
      },
    }

    return result
  }, {} as FacetChanged<FacetMap>)
}
