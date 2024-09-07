# @devrun_ryan/code-editor-react

`@devrun_ryan/code-editor-core` 를 활용한 리액트 코드에디터

## CodeEditor Component

- Compound Componet(합성 컴포넌트) 패턴

```jsx
import { CodeEditor } from '@devrun_ryan/code-editor-react'

<CodeEditor starterKit>
  <CodeEditor.ContentListener contentType='json'>
    {
      ({ content }) => /* ... */
    }
  </CodeEditor.ContentListener>
  <CodeEditor.Language>
    {
      ({ language, changeLanguage, supported }) => /* ... */
    }
  </CodeEditor.Language>
  <CodeEditor.Content content={editorContent} height='300px' />
</CodeEditor>
```

## hooks

CodeEditor 컴포넌트 내부에서 사용 (React Context API)

```tsx
// Example Component
const Example = () => {
  const { language, supported, changeLanguage } = useCodeEditorLanguage()

  // ...

  return // ...
}

export default Example

// X
<Example />
<CodeEditor>
 {/* ... */}
</CodeEditor>

// O
<CodeEditor>
  {/* ... */}
  <Example />
  {/* ... */}
</CodeEditor>
```

### useCodeEditorContent

```tsx
const { content } = useCodeEditorContent({ contentType })
```

- 현재 content를 지정한 contentType으로 제공(에디터 content가 업데이트 될 때마다 갱신)
- contentType은 'text' 또는 'json'

### useCodeEditorLanguage

```tsx
const { language, supported, changeLanguage } = useCodeEditorLanguage()
```

- 현재 에디터의 언어(`language`), 사용 가능 언어의 배열(`supported`), 언어 변경 함수(`changeLanguage`)를 제공
