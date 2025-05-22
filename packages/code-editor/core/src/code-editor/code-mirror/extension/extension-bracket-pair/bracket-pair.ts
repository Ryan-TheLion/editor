import {
  BaseBracketPairViewConstructor,
  bracketPairDefaultConfig,
  BracketPairPluginConfig,
  bracketTheme,
} from './view-plugin'
import { syntaxTreeViewPlugin } from '../../syntax-tree-plugin'

export const bracketPair = (
  bracketPairPlugin: BaseBracketPairViewConstructor,
  config: BracketPairPluginConfig = bracketPairDefaultConfig,
) => {
  return [
    bracketTheme,
    syntaxTreeViewPlugin(
      (view) => {
        return new bracketPairPlugin(view, config)
      },
      {
        decorations: (v) => v.decorations,
      },
    ),
  ]
}
