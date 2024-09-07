# @devrun_ryan/code-editor-core

Codemirror6 를 이용한 js 코드 에디터

## 에디터 지원 언어

- `javascript`
- `typescript`
- `jsx`
- `tsx`

## 기본 사용 방법

```js
/* 기본 (에디터 생성시 에디터 dom을 같이 전달) */

new CodeEditor({
  dom: document.getElementById('#editor'),
})

/* lazy (에디터를 먼저 생성하고, 에디터 dom을 이후에 삽입) */

const codeEditor = new CodeEditor()

// ...

const editorWrapper = document.createElement('div')
codeEditor.attachDom(editorWrapper)
```

## 옵션

```js

new CodeEditor({
  // (Optional) EditorState
  state,
  // (Optional) EditorView
  view,
  // (Optional) Codemirror view 에 적용할 dom (HTML Element)
  // 생성시 바로 적용하지 않을 경우, codeEditor.attachDom() 을 통해 dom을 주입
  dom,
  // (Optional) 에디터에 적용할 content
  // JSON 객체 또는 문자열(string)
  content,
  // (Optional) 에디터 테마
  // light, dark 또는 Extension
  theme = 'dark',
  // (Optional) line wrapping 적용 유무
  // boolean
  lineWrapping = false,
  // (Optional) line number 적용 유무
  // boolean
  lineNumber = false,
  // (Optional) active line gutter 적용 유무
  // boolean
  activeLineGutter = true,
  // (Optional) 에디터 언어
  // 'javascript' , 'typescript', 'jsx', 'tsx'
  language = 'javascript',
  // (Optional) 생성 후 에디터에 focus 할 지 유무
  // boolean
  autoFocus = false,
  // (Optional) 에디터에 추가로 적용할 Extensions
  // Extension 배열
  extraExtensions = [],
  // (Optional) 에디터에 추가로 적용할 StateField
  // 객체
  // ex. extraFields: {
  //       lineHighlight: lineHighlightField
  //     }
  extraFields
})

```

### serialize

```js
/* text */
const code = codeEditor.toText()

//...서버로 데이터 전송

/* json */
const json = codeEditor.toJSON()

const payload = json
// 또는
const payload = JSON.stringify(json)

// ...서버로 데이터 전송
```

### deserialize

```js
const content = /* 서버에서 받은 데이터(JSON 형식의 문자열이나 문자열) */
// json형식의 문자열일 경우
const content = JSON.parse(/* 서버에서 받은 데이터(JSON 형식의 문자열) */)

const codeEditor = new CodeEditor({
  // ...
  content
})

```

## theme

`light` , `dark` 두 개의 내부 제공 테마가 있으며, 다른 테마를 원할 경우 테마 Extension을 구현한 뒤 생성자 매개변수에 전달

```js
// 기본 제공
new CodeEditor({
  //...
  theme: 'light',
})

// theme Extension
new CodeEditor({
  //...
  theme: Theme,
})
```

## extension

### fira code

- [FiraCode](https://github.com/tonsky/FiraCode) 폰트를 적용

### scrollbar

- scrollbar 를 렌더링
- scrollbar 관련 extension을 적용하지 않을 경우 scroll은 되지만 scrollbar는 보이지 않음

```js
import { scrollbar } from '@devrun_ryan/code-editor-core/extension'

scrollbar({
  // (Optional) 가로 스크롤바 렌더링 유무
  // boolean
  horizontal = false,
  // (Optional) body에 overscroll-behavior를 contain으로 적용할 지 유무
  // (https://developer.chrome.com/blog/overscroll-behavior)
  // true로 할 경우 스크롤 시 브라우저 내장 스크롤 액션(뒤로 가기, 새로 고침...)이 발생하는 것을 방지
  // boolean
  preventOverflowScrollChain = true
})
```

### highlight line

- 특정 라인을 하이라이트 하고, 하이라이트 되지 않은 라인들은 희미하게 보임
- 현재는 여러 라인이 아닌 하나의 라인에서 개별적으로 적용 가능
- [예시 사이트](https://davidmyers.dev/blog/how-to-build-a-code-editor-with-codemirror-6-and-typescript/introduction#getting-the-most-out-of-the-codemirror-package)
- 단축키
  - `ctrl` + `h` / `cmd`(⌘) + `h`
    - 라인을 hightlight / unhighlight (toggle)
  - `ctrl` + `shift` + `h` / `cmd`(⌘) + `shift` + `h`
    - 라인을 unhighlight

```js
/* hightlight line Extension을 적용할 경우 field를 같이 적용해주세요 */

import { lineHighlight, lineHighlightFields } from '@devrun_ryan/code-editor-core/extension'

const codeEditor = new CodeEditor({
  //...
  extraExtensions: [
    //...
    lineHighlight(),
  ],
  extraFields: {
    //...
    ...lineHighlightFields,
  },
})
```

### prettier

> ❗ highlight line 을 적용한 후 prettier 할 경우 코드는 prettier 되지만, 적용된 highlight line 서식이 초기화 될 수 있음

- prettier를 적용
- `toolbar`, `keyBinding` 중 최소 1개 옵션은 적용(`true`)해야 함
- `ctrl` + `s` / `cmd`(⌘) + `s`

```js
import { prettier } from '@devrun_ryan/code-editor-core/extension'

prettier({
  // (Optional) prettier toolbar 렌더링
  // boolean
  toolbar = true,
  // (Optional) 단축키 적용 유무
  // boolean
  keyBinding = true
})
```
