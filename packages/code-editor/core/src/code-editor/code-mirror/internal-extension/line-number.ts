import { EditorState, StateEffect } from '@codemirror/state'
import { lineNumbers } from '@codemirror/view'
import { EditorCompartments } from '../editor'
import { compartmentHasExtension } from '../../../utils'

export const lineNumberExtension = ({
  lineNumberCompartment,

  initialActive,
}: {
  lineNumberCompartment: EditorCompartments['lineNumbers']
  initialActive: boolean
}) => {
  const lineNumbersPlugin = lineNumbers()

  const getTargetExtension = (active: boolean) => {
    return active ? lineNumbersPlugin : []
  }

  return [
    lineNumberCompartment.of(getTargetExtension(initialActive)),
    EditorState.transactionExtender.of((tr) => {
      const effect = tr.effects.findLast((effect) => effect.is(activeLineNumberEffect))

      if (!effect) return {}

      const currentActive = compartmentHasExtension({
        compartment: lineNumberCompartment,
        state: tr.state,
      })
      const expectedActive = effect.value

      if (currentActive === expectedActive) return {}

      return {
        effects: lineNumberCompartment.reconfigure(getTargetExtension(expectedActive)),
      }
    }),
  ]
}

export const activeLineNumberEffect = StateEffect.define<boolean>()
