import { TFilamentRecorder } from '../native/FilamentRecorder'
import { useWorkletCallback } from './useWorkletCallback'
import { useWorkletEffect } from './useWorkletEffect'

export interface OffscreenFrameInfo {
  recorder: TFilamentRecorder
  frameIndex: number
}

export function useRecorderRenderLoop(recorder: TFilamentRecorder, render: (frameInfo: OffscreenFrameInfo) => void): void {
  const memoizedRender = useWorkletCallback(render)

  useWorkletEffect(() => {
    'worklet'
    let frameCount = 0
    const listener = recorder.addOnReadyForMoreDataListener(() => {
      'worklet'
      memoizedRender({ frameIndex: frameCount, recorder: recorder })
      frameCount++
    })
    return () => {
      listener.remove()
    }
  }, [recorder, memoizedRender])
}
