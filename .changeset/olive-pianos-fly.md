---
'@devrun_ryan/code-editor-react': patch
'@devrun_ryan/code-editor-core': patch
'@devrun_ryan/editor-core': patch
'demo': patch
---

## '@devrun_ryan/code-editor-core'

- CodeEditor => CodeMirrorEditor (코어 클래스 이름 수정)
- CodeMIrrorViewer 코어 클래스 추가
- starterKit 을 적용하거나 수정하여 익스텐션을 적용할 수 있도록 기능 추가
- clipboard 복사 메소드 추가(copy)
- 브라켓 페어 extension, 주석 extension, 폰트 extension 추가
- 에디터 설정을 업데이트 할 수 있는 updateProps 메소드 추가
- css변수로 theme을 관리할 수 있도록 수정
- 폴더 구조 수정
- (tsup) entry 옵션 수정
- README.md 수정

## '@devrun_ryan/code-editor-react'

- CodeEditor => CodeMirror (코어 컴포넌트 이름 수정)
- jotai, jotai scope, jotai-optics 라이브러리를 이용하여 에디터 상태 관리
- 리액트 타입 라이브러리 버전 업데이트
- 비동기로 콘텐츠,언어를 설정할 수 있는 fetchPayload 프롭 추가
- 폴더 구조 수정
- (tsup) entry 옵션 수정, external 옵션 설정(react, react-dom)
- README.md 수정

## '@devrun_ryan/editor-core'

- prosemirror 업데이트

## 'apps/demo'

- 리액트 타입 라이브러리 버전 업데이트
- '@devrun_ryan/code-editor-core' 패키지 적용
