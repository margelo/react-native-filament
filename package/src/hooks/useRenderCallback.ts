import { useEffect } from 'react'
import type { Engine, RenderCallback } from '../types'
import { reportWorkletError } from '../ErrorUtils'
import { FilamentProxy } from '../native/FilamentProxy'
import { useSharedValue } from 'react-native-worklets-core'

export function useRenderCallback(engine: Engine, onFrame: RenderCallback) {
  const renderCallback = useSharedValue(onFrame)
  renderCallback.value = onFrame

  useEffect(() => {
    const context = FilamentProxy.getWorkletContext()
    // configure a render callback when this hook mounts
    Worklets.createRunInContextFn(() => {
      'worklet'
      engine.setRenderCallback((...args) => {
        try {
          renderCallback.value(...args)
        } catch (e) {
          reportWorkletError(e)
        }
      })
    }, context)()
    return () => {
      // remove render callback on unmount
      engine.setRenderCallback(undefined)
    }
  }, [engine, renderCallback])
}
