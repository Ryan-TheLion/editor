import { EditorContentPayload } from '@devrun_ryan/code-editor-core'
import { ContentPayload, useCodeMirrorEditorContent } from '../../hooks'

export interface ContentCallbackProps<ContentType extends keyof EditorContentPayload>
  extends ContentPayload<ContentType> {}

export interface ContentListenerProps<ContentType extends keyof EditorContentPayload> {
  contentType: ContentType
  children: (props: ContentCallbackProps<ContentType>) => React.ReactNode
}

export const CodeMirrorContentListener = <ContentType extends keyof EditorContentPayload>({
  contentType,
  children,
}: ContentListenerProps<ContentType>) => {
  const { content } = useCodeMirrorEditorContent({ contentType })

  return children({ content })
}
