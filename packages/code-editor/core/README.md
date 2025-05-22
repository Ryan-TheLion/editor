# @devrun_ryan/code-editor-core

Codemirror6 를 이용한 코드 에디터

## 에디터 지원 언어

1. 기본

- `javascript`
- `typescript`
- `jsx`
- `tsx`

2. 커스텀

- 에디터 languages를 설정하여 사용할 언어를 커스텀해서 전달할 수 있음

## 기본 사용 방법

```js
/* 기본 (에디터 생성시 에디터 dom을 같이 전달) */

const codeEditor = new CodeMirrorEditor({
  dom: document.getElementById('#editor'),
})

/* lazy (에디터를 먼저 생성하고, 에디터 dom을 이후에 삽입) */

const codeEditor = new CodeMirrorEditor()

// ...

const editorWrapper = document.createElement('div')
codeEditor.attachDom(editorWrapper)
```

## 옵션

```ts
new CodeMirrorEditor({
  // 생성시 바로 적용하지 않을 경우, codeEditor.attachDom() 을 통해 dom을 주입
  dom,
  // (Optional) 에디터에 적용할 content
  // JSON 객체 또는 문자열(string)
  content,
  // (Optional) 에디터 뷰 최대 높이
  // string (~px, ~em, ...)
  maxHeight,
  // (Optional) 에디터 테마
  theme = {
    light: lightTheme
    dark: darkTheme
  },
  // (Optional) 에디터 테마 모드
  // 'light' | 'dark'
  themeMode = 'dark',
  // (Optional) editable 설정
  // boolean
  editable = true,
  // (Optional) 에디터 언어 목록
  // Record<Key, LanguageSupport>
  languages = codeMirrorEditorDefaultLanguages
  // (Optional) 에디터 언어
  // languages 에 전달된 언어 객체의 키 값
  // 기본: 'javascript' , 'typescript', 'jsx', 'tsx'
  language = 'javascript',
  // (Optional) 생성 후 에디터에 focus 할 지 유무
  // boolean
  autoFocus = false,
  // (Optional) line number 적용 유무
  // boolean
  lineNumber = false,
  // (Optional) 에디터 콘텐츠에 맞게 높이를 적용할 지 유무
  fitContent = false,
  // (Optional) 에디터에 추가로 적용할 Extensions
  // Extension[]
  extensions = [],
  // (Optional) true를 반환할 경우 transaction 적용되지 않음
  // (tr: Transaction) => void | boolean
  disableTransaction,
  // (Optional) 에디터 콘텐츠가 수정되었을 때 콜백함수
  // (contentMap: { text: string; json: Record<any, any> }) => void
  onChange,
  // (Optional) 에디터 뷰가 destroy 되었을 때 콜백함수
  // (view: EditorView) => void
  onDestroy,
})
```

## serialize

```js
/* text */
const code = codeMirrorEditor.toText()

/* json */
const json = codeMirrorEditor.toJSON()
```

## deserialize

```js
// 문자열인 경우
const content = 'const a = 1'

const codeEditor = new CodeMirrorEditor({
  // ...
  content,
})

// ---

// json형식의 문자열인 경우
const content = JSON.parse(/* 서버에서 받은 데이터(toJSON()으로 생성한 JSON 형식의 문자열) */)

const codeEditor = new CodeMirrorEditor({
  // ...
  content,
})
```

## extension

### prettier

- `formatWithPrettier` command를 통해 prettier 적용할 수 있음
- prettier 라이브러리가 설치 되어 있어야 함(peerDependencies)

```js
import { formatWithPrettier } from '@devrun_ryan/code-editor-core'

formatWithPrettier(config /* prettier config */)
```

### factory

extension 프리셋을 적용하거나, 확장하여 에디터 extensions 를 생성할 수 있도록 도와 줌

- CodeMirrorEditor.starterKit
<!-- prettier-ignore-start -->

```js
// extesion 프리셋 전부 적용
const codeEditor = new CodeMirrorEditor({
  // ...
  extensions: CodeMirrorEditor.starterKit,
})
```

<!-- prettier-ignore-end -->

- CodeMirrorEditor.extensionFactory

  - combineStarterKit
  <!-- prettier-ignore-start -->

  ```js
  const codeEditor = new CodeMirrorEditor({
    // ...
    extensions: CodeMirrorEditor.combineStarterKit(
      ({
        history,
        scrollbar,
        codeMirrorKeymap,
        // ...
      }) => {
        return [
          history(),
          scrollbar(),
          codeMirrorKeymap.of([
            // custom key binding
          ]),
          // ...
        ]
      },
    ),
  })
  ```

  <!-- prettier-ignore-end -->

- extendStarterKit

  ```js
  const codeEditor = new CodeMirrorEditor({
    // ...
    extensions: CodeMirrorEditor.extendStarterKit(
      [
        /* extra extensions */
      ],
      {
        excludes: ['history' /* ... */], // starterKit에서 제외하고 싶은 플러그인의 키
      },
    ),
  })
  ```

## method

### runCommand

- `@codemirror/commands` 의 command, 또는 원하는 커맨드를 실행
- focus옵션이 true일 경우 커맨드 실행전에 view.focus() 로 focus 가 유지되게 함
- type: `(command: Command | keyof CodeMirrorBaseCommands, { focus = true }: { focus?: boolean } = {}) => boolean`

```js
// example

import { toggleLineHighlight } from '@devrun_ryan/code-editor-core'

editor.runCommand('cursorDocEnd')

editor.runCommand(toggleLineHighlight)
```
