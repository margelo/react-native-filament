import { useCallback } from 'react'
import { runOnRenderThread, useFilamentContext, useRenderThreadEffect } from 'react-native-filament'

interface FrameCounter {
  __rnfBenchFrames?: number
}

/** Counts rendered frames on the render thread without requesting any; returns a reader for the count. */
export function useRenderFrameCounter(): () => Promise<number> {
  const { engine } = useFilamentContext()
  useRenderThreadEffect(() => {
    'worklet'
    const counter = globalThis as unknown as FrameCounter
    counter.__rnfBenchFrames = 0
    const subscription = engine.addOnFrameListener(() => {
      counter.__rnfBenchFrames = (counter.__rnfBenchFrames ?? 0) + 1
      return false
    })
    return () => subscription.remove()
  }, [engine])
  return useCallback(
    () =>
      runOnRenderThread(engine, () => {
        'worklet'
        return (globalThis as unknown as FrameCounter).__rnfBenchFrames ?? 0
      }),
    [engine]
  )
}
