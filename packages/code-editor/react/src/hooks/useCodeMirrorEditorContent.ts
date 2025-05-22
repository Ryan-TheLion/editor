import { EditorContentPayload } from '@devrun_ryan/code-editor-core'
import { useCodeMirrorEditorAtomValue } from '../store'

export interface ContentPayload<ContentType extends keyof EditorContentPayload> {
  content: EditorContentPayload[ContentType]
}

interface UseCodeEditorContentProps<ContentType extends keyof EditorContentPayload> {
  contentType: ContentType
}

export const useCodeMirrorEditorContent = <ContentType extends keyof EditorContentPayload>({
  contentType,
}: UseCodeEditorContentProps<ContentType>): ContentPayload<ContentType> => {
  const content = useCodeMirrorEditorAtomValue(contentType === 'text' ? 'content' : 'json')

  return {
    content,
  } as ContentPayload<ContentType>
}
