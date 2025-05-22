# @devrun_ryan/code-editor-react

`@devrun_ryan/code-editor-core` 를 활용한 리액트 코드에디터

## CodeMirror Component

Compound Component(합성 컴포넌트) 패턴

### CodeMirror

에디터 코어 컴포넌트

<!-- prettier-ignore-start -->

```jsx
// example

import { Transaction } from '@devrun_ryan/code-editor-core/cm'
import { CodeMirror } from '@devrun_ryan/code-editor-react'

const fetchPayload = async () => {
  /* fetch */

  return {
    content: json ? JSON.parse(json) : '',
    language: 'tsx',
  }
}

const Editor = () => {
  return (
    <CodeMirror
      starterKit
      fetchPayload={fetchPayload}
      loadingFallback={<div>loading...</div>}
    >
      <CodeMirror.EditorWrapper>
        <CodeMirror.Content fitContent maxHeight={'300px'} />
      </CodeMirror.EditorWrapper>
    </CodeMirror>
  )
}

// ---

// disableTransaction example

const Editor = () => {
  return (
    <CodeMirror
      starterKit
      fetchPayload={fetchPayload}
      loadingFallback={<div>loading...</div>}>
      disableTransaction={(tr) => {
        const userEvent = tr.annotation(Transaction.userEvent)

        if (!userEvent) return
        if (!userEvent.startsWith('input')) return

        // 1000 자가 넘은 상황에서 입력할 경우 입력되지 않게 함
        return tr.state.doc.toString().length > 1000
      }}
    >
      <CodeMirror.EditorWrapper>
        <CodeMirror.Content fitContent maxHeight={'300px'} />
      </CodeMirror.EditorWrapper>
    </CodeMirror>
  )
}

export default Editor
```

<!-- prettier-ignore-end -->

- 주요 props

<!-- prettier-ignore-start -->

| prop | 타입 | 설명 |
| ---- | --- | --- |
| loadingFallback | `React.ReactNode` | 에디터 로딩 중 보여줄 fallback 컴포넌트 |
| languages | `Record<string, LanguageSupport>` | 에디터에서 사용할 언어 extension |
| language | `string` | <ul><li>에디터 언어</li><li>`languages`를 설정하지 않을 경우 기본값 `javascript`, `typescript`, `jsx`, `tsx`</ul> |
| content | `string \| Record<any, any>` | (초기) 에디터 콘텐츠 |
| fetchPayload | `() => Promise<{ content: CodeMirrorEditorContent; language?: string}>` | <ul><li>비동기로 (초기) 에디터 콘텐츠, 언어를 설정</li><li>언어를 설정하지 않을 경우 prop의 language로 설정 됨</li></ul>  |
| disableTransaction | `(tr:Transaction) => void \| boolean` | `true` 를 반환할 경우 transaction 적용하지 않음(해당 transaction 에 의한 업데이트 발생하지 않음) |
| lineNumber | `boolean` | 줄 번호를 보여줄지 유무 |
| starterKit | `boolean` | extension 프리셋을 적용할 지 유무, `true`인 경우 `extensions` 는 무시 됨 |
| extensions | `Extension[]` | 에디터에 적용할 익스텐션 배열 |

<!-- prettier-ignore-end -->

### CodeEditor.EditorWrapper

- 에디터 래퍼 컴포넌트

```jsx
// editor wrapper example

import { CodeMirror } from '@devrun_ryan/code-editor-react'

const Editor = () => {
  return (
    <CodeMirror starterKit>
      <CodeMirror.EditorWrapper
        as={'div' /* 'div' | 'section' | ... */}
        editorBackground
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '12px',
        }}
      >
        <Toolbar />
        <CodeMirror.Content fitContent maxHeight="200px" />
      </CodeMirror.EditorWrapper>
    </CodeMirror>
  )
}
```

<!-- prettier-ignore-start -->

| prop | 타입 | 설명 |
| ---- | --- | --- |
| as | `React.ElementType` | 렌더링할 Tag(DOM) 이름, 기본 값 `'div'` |
| editorBackground | `boolean` | editor의 background와 동일한 배경색으로 설정할 것인지 유무 |
| children | `React.ReactNode` | 자식 컴포넌트 |
| ...props | `Omit<ComponentPropsWithoutRef<T>, 'children'>` | as로 설정한 Tag에 따른 속성들 |

<!-- prettier-ignore-end -->

### CodeMirror.Content

- 에디터 뷰를 렌더링
- `fitContent` 가 `true`인 경우 에디터 콘텐츠의 높이에 맞도록 높이를 설정 (`maxHeight` 를 설정한 경우 콘텐츠 높이가 `maxHeight` 보다 작으면 콘텐츠 높이에 맞도록 높이가 설정되고, 콘텐츠 높이가 `maxHeight` 보다 크면 스크롤이 생성 됨)

### CodeMirror.ContentListener

- Render Props 패턴
- `useCodeMirrorEditorContent` 커스텀 훅을 이용해 만든 함수형 컴포넌트와 동일한 결과

```jsx
<CodeMirror>
  <CodeMirror.ContentListener contentType={'text' /* 'text' | 'json' */}>
      {
        ({ content }) => /* ... */
      }
  </CodeMirror.ContentListener>
</CodeMirror>
```

### CodeMirror.Language

- Render Props 패턴
- `useCodeMirrorEditorLanguage` 커스텀 훅을 이용해 만든 함수형 컴포넌트와 동일한 결과

```jsx
<CodeMirror>
  <CodeMirror.Language>
    {
      ({ language, setLanguage, supportedLanguages }) => /* ... */
    }
  </CodeMirror.Language>
</CodeMirror>
```

### CodeMirrorViewer

에디터 뷰어

- `lineNumber` 기본값 `false`
- `useCodeMirrorEditorLanguage` 등 기존 커스텀 훅을 이용하여 커스텀 컴포넌트 구현 가능

<!-- prettier-ignore-start -->

```jsx
// example

import { CodeMirrorViewer } from '@devrun_ryan/code-editor-react'
import {
  useCodeMirrorEditor,
  useCodeMirrorEditorLanguage,
} from '@devrun_ryan/code-editor-react/hooks'

export const EditorViewer = () => {
  const fetchPayload = async () => {
    const json = localStorage.getItem('cm-json')

    return {
      content: json ? JSON.parse(json) : '',
      language: 'tsx'
    }
  }

  return (
    <CodeMirrorViewer
      starterKit
      fetchPayload={fetchPayload}
    >
      <CodeMirror.EditorWrapper
        editorBackground
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '12px',
        }}
      >
        <div style={{
          display: 'flex'
          justifyContent: 'space-between'
        }}>
          <Lang />
          <Copy />
        </div>
        <CodeMirrorViewer.Content maxHeight="200px" />
      </CodeMirror.EditorWrapper>
    </CodeMirrorViewer>
  )
}

const Lang = () => {
  const { language } = useCodeMirrorEditorLanguage()

  return <div>{language}</div>
}

const Copy = () => {
  const viewer = useCodeMirrorEditor()

  return (
    <button
      onClick={() => {
        viewer?.copy({
          success(text) {
            alert(`클립보드 복사 성공\n${text}`)
          },
        })
      }}
    >
      copy
    </button>
  )
}
```

<!-- prettier-ignore-end -->

### CodeEditorViewer.Content

`CodeMirror.Content` 와 동일(fitContent 프롭만 제외 됨)

## hooks

`CodeMirror` 컴포넌트 내부에서 사용

<!-- prettier-ignore-start -->

```jsx
const Example = () => {
  const { language, setLanguage, supportedLanguages } = useCodeMirrorEditorLanguage()

  // ...

  return // ...
}

export default Example

// ❌ 에디터 스코프 내 컴포넌트가 있지 않을 경우 공유된 상태를 이용할 수 없음
<Example />
<CodeMirror>
 {/* ... */}
</CodeMirror>

// ✅ 에디터 스코프 내 컴포넌트가 있어야 공유된 상태를 이용할 수 있음
<CodeMirror>
  {/* ... */}
  <Example />
  {/* ... */}
</CodeMirror>
```

<!-- prettier-ignore-end -->

### useCodeMirrorEditorContent

```ts
const { content } = useCodeMirrorEditorContent({ contentType })
```

- 현재 content를 지정한 contentType으로 제공(에디터 content가 업데이트 될 때마다 갱신)
- contentType은 'text' 또는 'json'

### useCodeMirrorEditorLanguage

```jsx
const { language, setLanguage, supportedLanguages } = useCodeEditorLanguage()
```

- 현재 에디터의 언어(`language`), 사용 가능 언어의 배열(`supportedLanguages`), 언어 설정(`setLanguage`)을 제공

### useCodeMirrorCommnad

```jsx
// example

import { toggleLineHighlight } from '@devrun_ryan/code-editor-core'
import { useCodeMirrorCommand, useCodeMirrorEditor } from '@devrun_ryan/code-editor-react/hooks'


const Toolbar = () => {
  const editor = useCodeMirrorEditor()

  // 커맨드를 특정하지 않고 싶은 경우
  const runCommand = useCodeMirrorCommand()

  // 특정 커맨드만 실행하고 싶은 경우
  const runToggleLineHighlight = useCodeMirrorCommand(toggleLineHighlight)

  const Save = () => {
    return (
      <button
        onClick={() => {
          const json = editor.toJSON()

          localStorage.setItem('cm-json', JSON.stringify(json))
        }}
      >
        save
      </button>
    )
  }

  const CursorDocEnd = () => {
    return <button onClick={() => runCommand('cursorDocEnd')}>cursorDocEnd</button>
  }

  const ToggleLineHighlight = () => {
    return <button onClick={() => runToggleLineHighlight()}>toggle lineHighlight</button>
  }

  return (
    <div>
      <Save>
      <CursorDocEnd />
      <ToggleLineHighlight />
    </div>
  )
}
```
