/**
 * debounce 함수
 *
 * - lodash 라이브러리를 이용할 수도 있지만, 추가 라이브러리 없이 사용하기 위해 간단하게 구현 함
 * - 이후 모노레포 개선으로 util 함수를 모은 패키지 분리가 된다면 해당 유틸 패키지의 메소드로 대체될 수도 있음
 */
export const debounce = <Fn extends (...args: any[]) => any>(fn: Fn, delay: number) => {
  let timerId: any

  return (...args: Parameters<Fn>) => {
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * throttle 함수
 *
 * - lodash 라이브러리를 이용할 수도 있지만, 추가 라이브러리 없이 사용하기 위해 간단하게 구현 함
 * - 이후 모노레포 개선으로 util 함수를 모은 패키지 분리가 된다면 해당 유틸 패키지의 메소드로 대체될 수도 있음
 */
export const throttle = <Fn extends (...args: any[]) => any>(fn: Fn, delay: number) => {
  let latest = 0

  return (...args: Parameters<Fn>) => {
    const now = Date.now()

    if (now - latest < delay) return

    latest = now

    fn.apply(this, args)
  }
}
