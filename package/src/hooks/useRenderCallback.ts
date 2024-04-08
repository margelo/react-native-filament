import { useEffect } from 'react'
import type { Engine, RenderCallback } from '../types'
import { reportWorkletError } from '../ErrorUtils'
import { FilamentProxy } from '../native/FilamentProxy'
import { Worklets } from 'react-native-worklets-core'

const context = FilamentProxy.getWorkletContext()

export function useRenderCallback(engine: Engine, onFrame: RenderCallback) {
  useEffect(() => {
    Worklets.createRunInContextFn(() => {
      'worklet'
      engine.setRenderCallback((...args) => {
        'worklet'

        // TODO: Right now the worklet context isn't deallocated when we reload the app.
        // If you remove all the code below (so just pass an empty worklet function to setRenderCallback),
        // everything gets cleaned up properly.
        try {
          onFrame(...args)
        } catch (e) {
          reportWorkletError(e)
        }
      })
    }, context)()
    return () => {
      // remove render callback on unmount
      engine.setRenderCallback(undefined)
    }
  }, [engine, onFrame])
}
