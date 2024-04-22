import { useEffect } from 'react'
import type { RenderCallback } from '../types'
import { reportWorkletError } from '../ErrorUtils'
import { Worklets } from 'react-native-worklets-core'
import { useFilamentContext } from '../FilamentContext'

/**
 * This function will be called every frame. You can use it to update your scene.
 *
 * @note Don't call any methods on `engine` here - this will lead to deadlocks!
 */
export function useRenderCallback(onFrame: RenderCallback) {
  const { engine, _workletContext } = useFilamentContext()

  useEffect(() => {
    Worklets.createRunInContextFn(() => {
      'worklet'
      engine.setRenderCallback((...args) => {
        'worklet'

        try {
          onFrame(...args)
        } catch (e) {
          reportWorkletError(e)
        }
      })
    }, _workletContext)()
    return () => {
      // remove render callback on unmount
      engine.setRenderCallback(undefined)
    }
  }, [_workletContext, engine, onFrame])
}
