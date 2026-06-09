"use client"

import { useEffect, useState } from "react"

export function useAnimatedNumber(
  target: number,
  { duration = 600, enabled = true }: { duration?: number; enabled?: boolean } = {}
) {
  const [value, setValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    const start = performance.now()
    const from = value
    const delta = target - from

    if (delta === 0) return

    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + delta * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled, duration])

  return value
}
