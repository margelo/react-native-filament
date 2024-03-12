import { useEffect, useRef } from 'react'
import type { Engine, RenderCallback } from '../types'
import { reportError } from '../ErrorUtils'

export function useRenderCallback(engine: Engine, onFrame: RenderCallback) {
  const renderCallback = useRef(onFrame)
  renderCallback.current = onFrame

  useEffect(() => {
    // configure a render callback when this hook mounts
    engine.setRenderCallback((...args) => {
      try {
        renderCallback.current(...args)
      } catch (e) {
        reportError(e)
      }
    })
    return () => {
      // remove render callback on unmount
      engine.setRenderCallback(undefined)
    }
  }, [engine])
}
