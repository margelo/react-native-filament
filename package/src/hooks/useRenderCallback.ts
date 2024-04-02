import { useEffect } from 'react'
import type { Engine, RenderCallback } from '../types'
import { reportWorkletError } from '../ErrorUtils'
import { FilamentProxy } from '../native/FilamentProxy'
import { useWorklet } from 'react-native-worklets-core'

const context = FilamentProxy.getWorkletContext()

export function useRenderCallback(engine: Engine, onFrame: RenderCallback) {
  const renderCallback: RenderCallback = useWorklet(context, onFrame, [onFrame])

  useEffect(() => {
    // configure a render callback when this hook mounts
    Worklets.createRunInContextFn(() => {
      'worklet'
      engine.setRenderCallback((...args) => {
        try {
          renderCallback(...args)
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
