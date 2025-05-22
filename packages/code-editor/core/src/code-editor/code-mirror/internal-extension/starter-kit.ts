import { history } from '@codemirror/commands'
import { Extension } from '@codemirror/state'
import {
  comment,
  editorFontPreset,
  highlightMatchedBracket,
  highlightMatchedSelection,
  jsBracketPair,
  lineHighlight,
  preventScrollChain,
  scrollbar,
  viewActiveLine,
  viewActiveLineGutter,
} from '../extension'
import { drawSelection, KeyBinding, keymap } from '@codemirror/view'
import { codeMirrorKeybindings } from '../keymaps'

interface StarterKitOptions {
  excludes?: StarterKitExtensionKey[] | 'all'
}

type StarterKitExtensionKey = keyof ReturnType<typeof getStarterKitExtensionMap>

export interface ExtensionFactory {
  combineStarterKit: (
    callback: (starterKitExtensions: {
      history: typeof history
      scrollbar: typeof scrollbar
      preventScrollChain: typeof preventScrollChain
      drawSelection: typeof drawSelection
      viewActiveLine: typeof viewActiveLine
      viewActiveLineGutter: typeof viewActiveLineGutter
      jsBracketPair: typeof jsBracketPair
      highlightMatchedBracket: typeof highlightMatchedBracket
      highlightMatchedSelection: typeof highlightMatchedSelection
      comment: typeof comment
      lineHighlight: typeof lineHighlight
      editorFontPreset: typeof editorFontPreset
      codeMirrorKeymap: typeof keymap
      keyBindings: (opt?: {
        indentWithTab?: boolean
        historyKeymap?: boolean
        defaultKeymap?: boolean
      }) => KeyBinding[]
    }) => Extension[],
  ) => Extension[]

  extendStarterKit: (
    extraExtensions: Extension[],
    starterKitOptions?: StarterKitOptions,
  ) => Extension[]
}

const getStarterKitExtensionMap = () => ({
  history: history(),
  scrollbar: scrollbar(),
  preventScrollChain: preventScrollChain(),
  drawSelection: drawSelection(),
  viewActiveLine: viewActiveLine(),
  viewActiveLineGutter: viewActiveLineGutter(),
  jsBracketPair: jsBracketPair(),
  highlightMatchedBracket: highlightMatchedBracket({ brackets: '()[]{}<>' }),
  highlightMatchedSelection: highlightMatchedSelection(),
  comment: comment(),
  lineHighlight: lineHighlight(),
  editorFontPreset: editorFontPreset(),
  keymap: keymap.of([
    codeMirrorKeybindings.indentWithTab,
    ...codeMirrorKeybindings.historyKeymap,
    ...codeMirrorKeybindings.defaultKeymap,
  ]),
})

function hasExcludes(
  excludes: StarterKitOptions['excludes'],
): excludes is StarterKitExtensionKey[] {
  return Array.isArray(excludes) && !!excludes.length
}

export const starterKit = ({ excludes }: StarterKitOptions = {}): Extension[] => {
  if (excludes === 'all') return []

  if (hasExcludes(excludes)) {
    const targetExtensionMap = Array.from(Object.entries(getStarterKitExtensionMap())).reduce(
      (map, [key, extension]) => {
        if (excludes.includes(key as StarterKitExtensionKey)) {
          return {
            ...map,
          }
        }

        return {
          ...map,
          [key]: extension,
        }
      },
      {},
    )

    return Array.from(Object.values(targetExtensionMap))
  }

  return Array.from(Object.values(getStarterKitExtensionMap())) as Extension[]
}

export const extensionFactory: ExtensionFactory = {
  combineStarterKit(callback) {
    return callback({
      history,
      scrollbar,
      preventScrollChain,
      drawSelection,
      viewActiveLine,
      viewActiveLineGutter,
      jsBracketPair,
      highlightMatchedBracket,
      highlightMatchedSelection,
      comment,
      lineHighlight,
      editorFontPreset,
      codeMirrorKeymap: keymap,
      keyBindings: ({ indentWithTab = true, historyKeymap = true, defaultKeymap = true } = {}) => {
        const keyBinding: KeyBinding[] = []

        if (indentWithTab) keyBinding.push(codeMirrorKeybindings.indentWithTab)
        if (historyKeymap) keyBinding.push(...codeMirrorKeybindings.historyKeymap)
        if (defaultKeymap) keyBinding.push(...codeMirrorKeybindings.defaultKeymap)

        return keyBinding
      },
    })
  },
  extendStarterKit(extraExtensions, starterKitOptions) {
    const extensions = starterKit(starterKitOptions)

    extensions.push(...extraExtensions)

    return extensions
  },
}
