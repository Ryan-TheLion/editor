import { Compartment, EditorState, StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export const editableExtension = ({
  editableCompartment,
  initialEditable,
}: {
  editableCompartment: Compartment
  initialEditable: boolean
}) => {
  const getTargetExtension = (editable: boolean) => {
    return EditorView.editable.of(editable)
  }

  return [
    editableCompartment.of(getTargetExtension(initialEditable)),
    EditorState.transactionExtender.of((tr) => {
      const effect = tr.effects.findLast((effect) => effect.is(updateEditableEffect))

      if (!effect) return {}

      const currentEditable = tr.state.facet(EditorView.editable.reader)
      const expectedEditable = effect.value

      if (currentEditable === expectedEditable) return {}

      return {
        effects: editableCompartment.reconfigure(getTargetExtension(expectedEditable)),
      }
    }),
  ]
}

export const updateEditableEffect = StateEffect.define<boolean>()
