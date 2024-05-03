import { useEffect, useMemo } from 'react'
import { useFilamentContext } from '../FilamentContext'
import { FilamentProxy } from '../native/FilamentProxy'

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

  const swapChain = useMemo(() => {
    return engine.createSwapChainForRecorder(recorder)
  }, [engine, recorder])

  useEffect(() => {
    console.log('JS setting swapchain')
    engine.setSwapChain(swapChain)
  }, [engine, swapChain])

  return recorder
}
