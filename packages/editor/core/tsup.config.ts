import { defineTsupConfig } from '@org/tsup-config'
import { sassPlugin } from 'esbuild-sass-plugin'

export default defineTsupConfig({
  overrideConfig({ watch, env }) {
    const isDev = env?.NODE_ENV === 'development' || watch

    return {
      entry: [
        'src/index.ts',
        'src/prose-mirror/extensions/index.ts',
        'src/prose-mirror/utils/index.ts',
      ],
      minify: !isDev,
      clean: true,
      treeshake: false,
      esbuildPlugins: [sassPlugin({ type: 'css' })],
      // dist 폴더 css 파일의 이름을 프로젝트와 관련있는 이름으로 수정
      onSuccess: 'mv dist/index.css dist/editor.css && rm dist/prose-mirror/extensions/index.css',
    }
  },
})
