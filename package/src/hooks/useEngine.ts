import { useEffect, useMemo } from 'react'
import { Engine, RenderCallback } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'

interface Props {
  onFrame: RenderCallback
}

export function useEngine({ onFrame }: Props): Engine {
  const engine = useMemo(() => FilamentProxy.createEngine(), [])

  useEffect(() => {
    // update render callback whenever it changes
    engine.setRenderCallback(onFrame)
  }, [engine, onFrame])
  useEffect(() => {
    return () => {
      // remove render callback on unmount
      engine.setRenderCallback(undefined)
    }
  }, [engine])

  return engine
}
