import {
  CodeMirrorEditorDefaultLanguages,
  CodeMirrorEditorLanguages,
  CodeMirrorEditorViewer,
  CodeMirrorEditorViewerProps,
  editorThemeMode,
  HeightValue,
} from '@devrun_ryan/code-editor-core'
import { CodeMirrorProps } from './CodeMirror'
import { CodeMirrorViewerContent } from './CodeMirrorViewerContent'
import { CodeMirrorEditorScope, useCodeMirrorEditorStoreActions } from '../../store'
import { useCallback, useEffect, useLayoutEffect } from 'react'
import { useInitCodeMirrorViewer } from '../../hooks'
import { facetChanged } from '@devrun_ryan/code-editor-core/utils'

export interface CodeMirrorViewerProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends Omit<CodeMirrorEditorViewerProps<Languages, MaxHeightValue>, 'dom'>,
    Pick<
      CodeMirrorProps<Languages, MaxHeightValue>,
      'loadingFallback' | 'fetchPayload' | 'children' | 'starterKit'
    > {
  ref?: React.RefObject<CodeMirrorEditorViewer<Languages, MaxHeightValue> | null>
}

const Viewer = <
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
  onDestroy,
  ...props
}: CodeMirrorViewerProps<Languages, MaxHeightValue>) => {
  const { setEditorThemeMode, init, resetEditorContent } = useCodeMirrorEditorStoreActions()

  const handleDestroy: NonNullable<
    CodeMirrorEditorViewerProps<Languages, MaxHeightValue>['onDestroy']
  > = useCallback(
    (view) => {
      resetEditorContent()
      onDestroy?.(view)
    },
    [onDestroy],
  )

  const { viewer, status } = useInitCodeMirrorViewer<Languages, MaxHeightValue>({
    ref,
    starterKit,
    extensions,
    languages,
    content,
    fetchPayload,
    onDestroy: handleDestroy,
    ...props,
  })

  useLayoutEffect(() => {
    const cleanup = viewer?.subscribeUpdateListener((update) => {
      const changedMap = facetChanged(update, {
        themeMode: editorThemeMode,
      })

      if (changedMap.themeMode.changed) {
        setEditorThemeMode(changedMap.themeMode.value.current!)
      }
    })

    if (!viewer) return

    init(viewer)

    return () => {
      cleanup?.()
    }
  }, [viewer])

  useEffect(() => {
    viewer?.updateProps({ ...props })
  }, [viewer, props])

  if (status === 'loading') {
    return loadingFallback ?? null
  }

  return children
}

export const CodeMirrorViewer = <
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
>({
  ref,
  lineNumber = false,
  children,
  ...props
}: CodeMirrorViewerProps<Languages, MaxHeightValue>) => {
  return (
    <CodeMirrorEditorScope>
      <Viewer ref={ref} lineNumber={lineNumber} {...props}>
        {children}
      </Viewer>
    </CodeMirrorEditorScope>
  )
}

CodeMirrorViewer.Content = CodeMirrorViewerContent
