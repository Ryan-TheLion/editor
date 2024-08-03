import { defineConfig, Options } from 'tsup'

type MaybePromise<T> = T | Promise<T>

interface TsupConfigParam {
  overrideConfig?: (options: Options) => MaybePromise<Options | Options[]>
  options?: Options | Options[]
}

/**
 * @param TsupConfigParam \
 * `overrideConfig` - optional \
 * **공유 tsup config를 적용하면서 확장하고 싶은 경우**
 * - overrideConfig에서 옵션 객체를 반환하는 경우: { 기본 tsup config, ...override 옵션 } 으로 적용
 * - overrideConfig에서 옵션 배열을 반환하는 경우: [ 기본 tsup config, ...override 옵션 배열 ] 로 적용
 *
 * `options` - optional \
 * **공유 tsup config를 적용하지 않고 싶은 경우**
 * - 직접 옵션을 전달
 */
export const defineTsupConfig = ({ overrideConfig, options }: TsupConfigParam = {}) => {
  if (options) return options

  const baseTsupConfig = (options: Options) =>
    ({
      entry: ['src/**/*.ts', '!src/**/*.css.ts'],
      minify: !!options?.watch,
      dts: true,
      clean: true,
      format: ['cjs', 'esm'],
    }) as Options

  if (overrideConfig) {
    return defineConfig((options) => {
      const config = overrideConfig(options)

      if (Array.isArray(config)) {
        return [baseTsupConfig(options), ...config]
      }

      return {
        ...baseTsupConfig(options),
        ...config,
      }
    })
  }

  return defineConfig((options) => baseTsupConfig(options))
}
