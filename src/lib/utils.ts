/**
 * 防抖函数 - 延迟执行，频繁触发只执行最后一次
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  delay: number = 300
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: TArgs) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数 - 限制执行频率，在指定时间内只执行一次
 * @param fn 要执行的函数
 * @param limit 限制时间（毫秒）
 */
export function throttle<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  limit: number = 300
): (...args: TArgs) => void {
  let inThrottle = false

  return function (this: unknown, ...args: TArgs) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}