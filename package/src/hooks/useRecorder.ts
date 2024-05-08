import { useEffect, useMemo } from 'react'
import { useFilamentContext } from '../FilamentContext'
import { FilamentProxy } from '../native/FilamentProxy'
import { useDisposableResource } from './useDisposableResource'
import { runOnWorklet } from '../utilities/runOnWorklet'
import { useWorkletEffect } from './useWorkletEffect'

export type RecorderOptions = {
  width: number
  height: number
  fps: number
  bitRate: number
}

export function useRecorder(options: RecorderOptions) {
  const { engine } = useFilamentContext()
  const { width, height, fps, bitRate } = options
  const recorder = useMemo(() => {
    console.log('Creating recorder JS')
    return FilamentProxy.createRecorder(width, height, fps, bitRate)
  }, [bitRate, fps, height, width])

  const swapChain = useDisposableResource(
    runOnWorklet(() => {
      'worklet'
      return engine.createSwapChainForRecorder(recorder)
    }),
    [engine, recorder]
  )

  useWorkletEffect(() => {
    'worklet'
    if (swapChain == null) {
      return
    }

    console.log('JS setting swapchain')
    engine.setSwapChain(swapChain)
  }, [engine, swapChain])

  return recorder
}
