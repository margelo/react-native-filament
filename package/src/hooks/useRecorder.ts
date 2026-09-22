import { useMemo } from 'react'
import { runOnRuntimeAsync } from 'react-native-worklets'
import { useFilamentContext } from './useFilamentContext'
import { FilamentProxy } from '../native/FilamentProxy'
import { useDisposableResource } from './useDisposableResource'
import { useWorkletEffect } from './useWorkletEffect'
import { TFilamentRecorder } from '../types/FilamentRecorder'
import { SwapChain } from '../types'
import { Logger } from '../utilities/logger/Logger'

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
  const { engine, workletRuntime } = useFilamentContext()
  const recorder = useMemo(() => {
    Logger.debug('Creating recorder JS')
    return FilamentProxy.createRecorder(width, height, fps, bitRate)
  }, [bitRate, fps, height, width])

  const swapChain = useDisposableResource(
    () =>
      runOnRuntimeAsync(workletRuntime, () => {
        'worklet'
        return engine.createSwapChainForRecorder(recorder)
      }),
    [engine, recorder, workletRuntime]
  )

  useWorkletEffect(() => {
    'worklet'
    if (swapChain == null) {
      return
    }

    engine.setSwapChain(swapChain)
  })

  return { recorder, swapChain }
}
