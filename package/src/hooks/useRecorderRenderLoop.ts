import { useMemo } from 'react'
import { TFilamentRecorder } from '../types/FilamentRecorder.nitro'
import { useWorkletEffect } from './useWorkletEffect'
import { getWorkletDependencies } from 'react-native-worklets-core'

export interface OffscreenFrameInfo {
  recorder: TFilamentRecorder
  frameIndex: number
}

export function useRecorderRenderLoop(recorder: TFilamentRecorder, render: (frameInfo: OffscreenFrameInfo) => boolean): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRender = useMemo(() => render, getWorkletDependencies(render))

  useWorkletEffect(() => {
    'worklet'
    let frameCount = 0
    const listener = recorder.addOnReadyForMoreDataListener(() => {
      'worklet'
      const shouldRenderNext = memoizedRender({ frameIndex: frameCount, recorder: recorder })
      frameCount++
      return shouldRenderNext
    })
    return () => {
      'worklet'
      listener.remove()
    }
  })
}
