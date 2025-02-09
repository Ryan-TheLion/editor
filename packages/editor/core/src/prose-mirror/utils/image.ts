import { gcd } from '.'

export interface ImageDimension {
  width: number
  height: number
}

export type AspectRatioCombine<Return> = (args: {
  isNaN: boolean
  simplifiedWidthRatio: number
  simplifiedHeightRatio: number
}) => Return

export type AdjustedDimensionOption<Target extends 'width' | 'height' = 'width'> =
  Target extends 'width' ? { resizedHeight: number } : { resizedWidth: number }

export const imageAspectRatio: {
  <Combine extends AspectRatioCombine<any> = AspectRatioCombine<string>>(
    input: { width: number; height: number },
    combine?: Combine,
  ): ReturnType<Combine> | null
  <Combine extends AspectRatioCombine<any> = AspectRatioCombine<string>>(
    input: { dom: HTMLImageElement },
    combine?: Combine,
  ): ReturnType<Combine> | null
} = <Combine extends AspectRatioCombine<any>>(
  input: { width: number; height: number } | { dom: HTMLImageElement },
  combine?: Combine,
): ReturnType<Combine> | null => {
  const isDOM = 'dom' in input

  const width = isDOM ? input.dom.naturalWidth : input.width
  const height = isDOM ? input.dom.naturalHeight : input.height

  const divisor = gcd(width, height)

  const combineFn =
    combine ??
    (({ isNaN, simplifiedWidthRatio, simplifiedHeightRatio }) =>
      isNaN ? null : `${simplifiedWidthRatio} / ${simplifiedHeightRatio}`)

  return combineFn({
    isNaN: divisor === 0,
    simplifiedWidthRatio: width / divisor,
    simplifiedHeightRatio: height / divisor,
  })
}

export const adjustedDimension: {
  <Target extends 'width' | 'height' = 'width'>(
    input: HTMLImageElement,
    opt: { target: Target } & AdjustedDimensionOption<Target>,
  ): number
  <Target extends 'width' | 'height' = 'width'>(
    input: { originalWidth: number; originalHeight: number },
    opt: { target: Target } & AdjustedDimensionOption<Target>,
  ): number
} = (
  input: HTMLImageElement | { originalWidth: number; originalHeight: number },
  opt:
    | ({ target: 'width' } & AdjustedDimensionOption<'width'>)
    | ({ target: 'height' } & AdjustedDimensionOption<'height'>),
): number => {
  const isDOM = !('originalWidth' in input)

  const originalDimension = {
    width: isDOM ? input.naturalWidth : input.originalWidth,
    height: isDOM ? input.naturalHeight : input.originalHeight,
  }

  if (!originalDimension.width || !originalDimension.height) return 0

  const getRatio: AspectRatioCombine<number> = ({
    simplifiedWidthRatio,
    simplifiedHeightRatio,
  }) => {
    if (opt.target === 'width') {
      return simplifiedHeightRatio / simplifiedWidthRatio
    }

    return simplifiedWidthRatio / simplifiedHeightRatio
  }

  const ratio = isDOM
    ? imageAspectRatio({ dom: input }, getRatio)
    : imageAspectRatio(
        { width: originalDimension.width, height: originalDimension.height },
        getRatio,
      )

  if (!ratio) return 0

  const resizedValue = ((
    opt:
      | ({ target: 'width' } & AdjustedDimensionOption<'width'>)
      | ({ target: 'height' } & AdjustedDimensionOption<'height'>),
  ) => {
    if (opt.target === 'width') {
      return opt.resizedHeight
    }

    return opt.resizedWidth
  })(opt)

  return Number((resizedValue / ratio).toFixed(4))
}

export const getBase64Image = (file: File): Promise<HTMLImageElement | Error> => {
  return new Promise((resolve) => {
    try {
      const fileReader = new FileReader()

      const image = new Image()

      fileReader.onload = () => {
        image.src = fileReader.result as string
      }

      image.onload = () => {
        resolve(image)
      }

      image.onerror = () => {
        resolve(new Error('이미지를 불러올 수 없습니다다'))
      }

      fileReader.readAsDataURL(file)
    } catch (error) {
      resolve(error as any)
    }
  })
}

export const getImageFromSrc = (
  src: string,
): Promise<{ error: Error | null; image: HTMLImageElement | null }> => {
  return new Promise((resolve) => {
    try {
      const image = new Image()
      image.src = src

      image.onload = () => {
        image.onload = null
        image.onerror = null

        resolve({ error: null, image })
      }

      image.onerror = () => {
        resolve({ error: new Error('이미지를 불러올 수 없습니다'), image: null })
      }
    } catch (error) {
      resolve({ error: error as Error, image: null })
    }
  })
}

export const getImageDimensionFromFile = (file: File): Promise<ImageDimension> => {
  return new Promise((resolve) => {
    const image = new Image()

    try {
      image.src = URL.createObjectURL(file)

      image.onload = () => {
        const dimension: ImageDimension = {
          width: image.naturalWidth,
          height: image.naturalHeight,
        }

        URL.revokeObjectURL(image.src)

        resolve({
          ...dimension,
        })
      }

      image.onerror = () => {
        resolve({ width: 0, height: 0 })
      }
    } catch (error) {
      image.src && URL.revokeObjectURL(image.src)

      resolve({ width: 0, height: 0 })
    }
  })
}

export const getImageDimensionFromSrc = (src: string): Promise<ImageDimension> => {
  return new Promise((resolve) => {
    try {
      const image = new Image()
      image.src = src

      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
      }

      image.onerror = () => {
        resolve({ width: 0, height: 0 })
      }
    } catch (error) {
      resolve({ width: 0, height: 0 })
    }
  })
}

export const base64ToBlob = (base64: string) => {
  const regex = /^data:([a-zA-Z0-9+/.-]+\/[a-zA-Z0-9+/.-]+);/
  const match = base64.match(regex)
  const contentType = match ? match[1] : ''

  // Base64에서 data URI 접두어 제거
  const byteString = atob(base64.split(',')[1]!)

  // 각 바이트를 8비트 부호없는 정수 배열로 변환
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }

  // Blob 객체 생성
  return new Blob([uint8Array], { type: contentType })
}

export const isFile = (source: unknown) => {
  return source instanceof File
}
