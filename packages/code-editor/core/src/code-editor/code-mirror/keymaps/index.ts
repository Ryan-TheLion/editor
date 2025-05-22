import {
  defaultKeymap,
  emacsStyleKeymap,
  historyKeymap,
  indentWithTab,
  standardKeymap,
} from '@codemirror/commands'
import { foldKeymap } from '@codemirror/language'
import { searchKeymap } from '@codemirror/search'

export const codeMirrorKeybindings = {
  standardKeymap,
  defaultKeymap,
  emacsStyleKeymap,
  historyKeymap,
  indentWithTab,
  searchKeymap,
  foldKeymap,
}
