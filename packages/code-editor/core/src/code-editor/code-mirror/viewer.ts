import { CodeMirrorEditor, CodeMirrorEditorProps, HeightValue } from './editor'
import { CodeMirrorEditorDefaultLanguages, CodeMirrorEditorLanguages } from './languages'
import { starterKit } from './internal-extension'

export type AnyCodeMirrorEditorViewer = CodeMirrorEditorViewer<
  CodeMirrorEditorLanguages<string>,
  HeightValue
>

export type AnyCodeMirrorEditorViewerProps = CodeMirrorEditorViewerProps<
  CodeMirrorEditorLanguages<string>,
  HeightValue
>

type ExcludeKeys<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> = keyof Pick<
  CodeMirrorEditorProps<Languages, MaxHeightValue>,
  'autoFocus' | 'disableTransaction' | 'editable' | 'onChange' | 'fitContent'
>

export interface CodeMirrorEditorViewerProps<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends Omit<CodeMirrorEditorProps<Languages, MaxHeightValue>, ExcludeKeys> {}

/*
 * setEditable, setLanguage 등을 뷰어에서 호출할 수 없도록 수정한다면
 * CodeMirrorEditorBase 클래스를 만들어서
 * CodeMirrorEditor, CodeMirrorEditorViewer 클래스에 상속 후
 * 공통 외 필요한 메소드 등을 직접 구현하도록 변경될 수도 있음
 */

export class CodeMirrorEditorViewer<
  Languages extends CodeMirrorEditorLanguages<string> = CodeMirrorEditorDefaultLanguages,
  MaxHeightValue extends HeightValue = HeightValue,
> extends CodeMirrorEditor<Languages, MaxHeightValue> {
  constructor({ ...props }: CodeMirrorEditorViewerProps<Languages, MaxHeightValue>) {
    super({
      ...props,
      editable: false,
      autoFocus: false,
      fitContent: false,
    })
  }

  static starterKit = starterKit({
    excludes: ['viewActiveLine', 'viewActiveLineGutter', 'keymap'],
  })
}
