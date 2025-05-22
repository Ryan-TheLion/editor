/**
 * `clientX` 및 `clientY`를 사용하여 `layerX` 및 `layerY`에 해당하는 값을 계산하는 함수
 *
 * - `layerX`와 `layerY`가 더 이상 사용되지 않거나 지원되지 않는 환경(비표준 속성)에서 대체 방법을 제공
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/layerX}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/layerY}
 */
export const clientPosToLayerPos = ({
  event,
  target,
}: {
  event: MouseEvent | TouchEvent
  target?: HTMLElement
}) => {
  const targetElement = target ?? (event.target as HTMLElement)

  const { clientX, clientY } = ((event: MouseEvent | TouchEvent) => {
    if (event instanceof MouseEvent) {
      return {
        clientX: event.clientX,
        clientY: event.clientY,
      }
    }

    return {
      clientX: event.touches[0]!.clientX,
      clientY: event.touches[0]!.clientY,
    }
  })(event)

  const { top, left } = targetElement.getBoundingClientRect()

  return {
    layerX: Math.round(clientX - left),
    layerY: Math.round(clientY - top),
  }
}

/**
 * `offsetX` 및 `offsetY`에 해당하는 값을 계산하는 함수
 *
 * - TouchEvent에서는 offsetX, offsetY 가 제공되지 않아 계산이 필요함
 * - MouseEvent와 TouchEvent 에서 공용으로 사용하기 위한 목적으로 구현
 */
export const offsetPos = ({
  event,
  target,
}: {
  event: MouseEvent | TouchEvent
  target?: HTMLElement
}) => {
  if (event instanceof MouseEvent) {
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    }
  }

  const touch = event.touches[0]!

  const targetElement = target ?? (touch.target as HTMLElement)

  const rect = targetElement.getBoundingClientRect()

  return {
    offsetX: Math.ceil(touch.pageX - rect.left),
    offsetY: Math.ceil(touch.pageY - rect.top),
  }
}
