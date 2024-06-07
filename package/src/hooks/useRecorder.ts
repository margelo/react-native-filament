import { useMemo } from 'react'
import { useFilamentContext } from '../react/Context'
import { FilamentProxy } from '../native/FilamentProxy'
import { useDisposableResource } from './useDisposableResource'
import { useWorkletEffect } from './useWorkletEffect'
import { TFilamentRecorder } from '../types/FilamentRecorder'
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
  const { engine, workletContext } = useFilamentContext()
  const recorder = useMemo(() => {
    console.log('Creating recorder JS')
    return FilamentProxy.createRecorder(width, height, fps, bitRate)
  }, [bitRate, fps, height, width])

  const swapChain = useDisposableResource(
    workletContext.createRunAsync(() => {
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
