import { useEffect, useMemo } from 'react'
import type { Engine, RenderableManager } from '../types'

export function useRenderableManager(engine: Engine): RenderableManager {
  const renderableManager = useMemo(() => engine.createRenderableManager(), [engine])

  useEffect(() => {
    return () => {
      renderableManager.release()
    }
  }, [renderableManager])

  return renderableManager
}
