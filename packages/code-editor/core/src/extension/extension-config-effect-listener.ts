import { Extension, StateEffect } from '@codemirror/state'
import { ViewPlugin } from '@codemirror/view'

export const appendConfigListener = (callback: (extensions: Extension[]) => void) => {
  return ViewPlugin.define(() => {
    const isAppendConfigEffect = (effect: StateEffect<any>) => effect.is(StateEffect.appendConfig)

    return {
      update(update) {
        const targetTransactions = update.transactions.filter((tr) =>
          tr.effects.some(isAppendConfigEffect),
        )

        if (!targetTransactions?.length) return

        const extensions = targetTransactions.reduce((extension: Extension[], tr) => {
          for (const effect of tr.effects) {
            if (!isAppendConfigEffect(effect)) continue

            extension.push(effect.value)
          }

          return extension.flatMap((extension) => extension)
        }, [] as Extension[])

        callback(extensions)
      },
    }
  })
}
