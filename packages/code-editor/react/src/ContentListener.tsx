import { CodeEditorContentFilter, ContentPayload, useCodeEditorContent } from './hooks'

export interface ContentCallbackProps extends ContentPayload {}

export interface ContentListenerProps {
  contentType: CodeEditorContentFilter
  children: (props: ContentCallbackProps) => React.ReactNode
}

export const CodeEditorContentListener = ({ contentType, children }: ContentListenerProps) => {
  const { content } = useCodeEditorContent({ contentType })

  return children({ content })
}
