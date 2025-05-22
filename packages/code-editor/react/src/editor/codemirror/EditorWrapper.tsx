import { createElement, ElementType, ComponentPropsWithoutRef, useEffect, useRef } from 'react'
import { useCodeMirrorEditor } from '../../hooks'
import { editorColors, themeModeChanged } from '@devrun_ryan/code-editor-core'

type As<T extends ElementType> = T extends unknown ? ElementType : T

export type EditorWrapperProps<T extends ElementType = 'div'> = {
  as?: As<T>
  editorBackground?: boolean
  children: React.ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'children'>

export const EditorWrapper = <T extends ElementType = 'div'>({
  as = 'div' as As<T>,
  editorBackground,
  style,
  children,
  ...props
}: EditorWrapperProps<T>) => {
  const editor = useCodeMirrorEditor()

  const wrapperRef = useRef<HTMLElement>(null)

  if (!editor) {
    wrapperRef.current = null
  }

  useEffect(() => {
    const cleanup = editorBackground
      ? editor?.subscribeUpdateListener((update) => {
          if (!themeModeChanged(update)) return

          const colors = update.state.facet(editorColors)

          if (editorBackground && colors && wrapperRef.current) {
            wrapperRef.current.style.background = colors.editor.bg
          }
        })
      : null

    return () => {
      cleanup?.()
    }
  }, [editor, editorBackground, as])

  if (editor) {
    return createElement(
      as,
      {
        ...props,
        ref: wrapperRef,
        style: {
          ...style,
          ...(editorBackground && {
            backgroundColor: editor.colors!.editor.bg,
          }),
        },
      },
      children,
    )
  }

  return null
}
