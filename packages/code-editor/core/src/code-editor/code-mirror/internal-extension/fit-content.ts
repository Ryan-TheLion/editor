import { Compartment, EditorState, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { compartmentHasExtension } from '../../../utils'

export const fitContentExtension = ({
  fitContentCompartment,
  initialActive,
}: {
  fitContentCompartment: Compartment
  initialActive: boolean
}) => {
  const fitConentPlugin = ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        this.fitHeight(view)
      }

      update(update: ViewUpdate) {
        this.fitHeight(update.view)
      }

      fitHeight(view: EditorView) {
        const { clientHeight, scrollHeight } = view.scrollDOM

        if (clientHeight < scrollHeight) {
          view.dom.style.removeProperty('height')

          return
        }

        view.dom.style.height = `${view.contentHeight}px`
      }
    },
  )

  const getTargetExtension = (active: boolean) => {
    return active ? fitConentPlugin : []
  }

  return [
    fitContentCompartment.of(getTargetExtension(initialActive)),
    EditorState.transactionExtender.of((tr) => {
      const effect = tr.effects.findLast((effect) => effect.is(activeFitContentEffect))

      if (!effect) return {}

      const currentActive = compartmentHasExtension({
        compartment: fitContentCompartment,
        state: tr.state,
      })
      const expectedActive = effect.value

      if (currentActive === expectedActive) return {}

      return {
        effects: fitContentCompartment.reconfigure(getTargetExtension(expectedActive)),
      }
    }),
  ]
}

export const activeFitContentEffect = StateEffect.define<boolean>()
