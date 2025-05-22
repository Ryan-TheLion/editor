import {
  AnyCodeMirrorEditorProps,
  CodeMirrorEditor,
  CodeMirrorEditorContent,
  CodeMirrorEditorDefaultLanguages,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorProps,
  editorLanguage,
  editorThemeMode,
  HeightValue,
} from '@devrun_ryan/code-editor-core'
import { CodeMirrorContentListener } from './ContentListener'
import { useInitCodeMirrorEditor } from '../../hooks'
import { CodeMirrorEditorScope, useCodeMirrorEditorStoreActions } from '../../store'
import { CodeMirrorContent, CodeMirrorEditorContentProps } from './CodeMirrorContent'
import { CodeMirrorLanguage } from './CodeMirrorLanguage'
import { useCallback, useEffect, useLayoutEffect } from 'react'
import { EditorWrapper } from './EditorWrapper'
import { EditorView } from '@devrun_ryan/code-editor-core/cm'
import { facetChanged } from '@devrun_ryan/code-editor-core/utils'

type ExcludeKeys = Extract<
  keyof AnyCodeMirrorEditorProps,
  keyof CodeMirrorEditorContentProps | 'dom'
>

export interface CodeMirrorProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends Omit<CodeMirrorEditorProps<Languages, MaxHeightValue>, ExcludeKeys> {
  starterKit?: boolean
  loadingFallback?: React.ReactNode
  fetchPayload?: () => Promise<{
    content: CodeMirrorEditorContent
    language?: CodeMirrorProps<Languages, MaxHeightValue>['language']
  }>
  ref?: React.RefObject<CodeMirrorEditor<Languages, MaxHeightValue> | null>
  children: React.ReactNode
}

const Editor = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  ref,
  loadingFallback,
  children,
  starterKit,
  extensions,
  languages,
  content,
  fetchPayload,
  disableTransaction,
  onChange,
  onDestroy,
  ...props
}: CodeMirrorProps<Languages, MaxHeightValue>) => {
  const {
    setEditorEditable,
    setEditorLanguage,
    setEditorContentMap,
    setEditorThemeMode,
    init,
    resetEditorContent,
  } = useCodeMirrorEditorStoreActions()

  const handleChange: NonNullable<CodeMirrorProps<Languages, MaxHeightValue>['onChange']> =
    useCallback(
      (contentMap) => {
        setEditorContentMap(contentMap)
        onChange?.(contentMap)
      },
      [onChange],
    )

  const handleDestroy: NonNullable<CodeMirrorEditorProps<Languages, MaxHeightValue>['onDestroy']> =
    useCallback(
      (view) => {
        resetEditorContent()
        onDestroy?.(view)
      },
      [onDestroy],
    )

  const { editor, status } = useInitCodeMirrorEditor<Languages, MaxHeightValue>({
    ref,
    starterKit,
    extensions,
    languages,
    content,
    fetchPayload,
    disableTransaction,
    onChange: handleChange,
    onDestroy: handleDestroy,
    ...props,
  })

  useLayoutEffect(() => {
    const cleanup = editor?.subscribeUpdateListener((update) => {
      const changedMap = facetChanged(update, {
        editable: EditorView.editable,
        language: editorLanguage,
        themeMode: editorThemeMode,
      })

      if (changedMap.editable.changed) {
        setEditorEditable(changedMap.editable.value.current)
      }

      if (changedMap.language.changed) {
        setEditorLanguage(changedMap.language.value.current)
      }

      if (changedMap.themeMode.changed) {
        setEditorThemeMode(changedMap.themeMode.value.current!)
      }
    })

    if (!editor) return

    init(editor)

    return () => {
      cleanup?.()
    }
  }, [editor])

  useEffect(() => {
    editor?.updateProps({ ...props })
  }, [editor, props])

  if (status === 'loading') {
    return loadingFallback ?? null
  }

  return children
}

export const CodeMirror = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  ref,
  children,
  ...props
}: CodeMirrorProps<Languages, MaxHeightValue>) => {
  return (
    <CodeMirrorEditorScope>
      <Editor ref={ref} {...props}>
        {children}
      </Editor>
    </CodeMirrorEditorScope>
  )
}

CodeMirror.Content = CodeMirrorContent
CodeMirror.ContentListener = CodeMirrorContentListener
CodeMirror.Language = CodeMirrorLanguage
CodeMirror.EditorWrapper = EditorWrapper
