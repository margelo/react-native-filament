import { useEffect, useRef } from 'react'
import type { Engine, RenderCallback } from '../types'

export function useRenderCallback(engine: Engine, onFrame: RenderCallback): Engine {
  const renderCallback = useRef(onFrame)
  renderCallback.current = onFrame

  useEffect(() => {
    // configure a render callback when this hook mounts
    engine.setRenderCallback((...args) => {
      try {
        renderCallback.current(...args)
      } catch (e) {
        // @ts-expect-error this is defined by react-native.
        if (global.ErorrUtils != null) {
          // @ts-expect-error this is defined by react-native.
          global.ErrorUtils.reportFatalError(e)
        } else {
          console.error(`Filament failed to render!`, e)
        }
      }
    })
    return () => {
      // remove render callback on unmount
      engine.setRenderCallback(undefined)
    }
  }, [engine])

  return engine
}
