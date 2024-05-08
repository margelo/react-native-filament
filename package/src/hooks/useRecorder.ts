import { useMemo } from 'react'
import { useFilamentContext } from '../FilamentContext'
import { FilamentProxy } from '../native/FilamentProxy'
import { useDisposableResource } from './useDisposableResource'
import { runOnWorklet } from '../utilities/runOnWorklet'
import { useWorkletEffect } from './useWorkletEffect'
import { TFilamentRecorder } from '../native/FilamentRecorder'
import { SwapChain } from '../types'

export type RecorderOptions = {
  width: number
  height: number
  fps: number
  bitRate: number
}

type Result = {
  recorder: TFilamentRecorder
  swapChain: SwapChain | undefined
}

export function useRecorder({ width, height, fps, bitRate }: RecorderOptions): Result {
  const { engine } = useFilamentContext()
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
  })

  return { recorder, swapChain }
}
