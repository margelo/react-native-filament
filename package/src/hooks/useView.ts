import { useEffect, useMemo } from 'react'
import { Engine, View } from '../types'

export function useView(engine: Engine): View {
  const view = useMemo(() => engine.getView(), [engine])

  useEffect(() => {
    return () => {
      view.release()
    }
  }, [view])

  return view
}
