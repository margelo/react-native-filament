import { useMemo } from 'react'
import { Engine, View } from '../types'

export function useView(engine: Engine): View {
  return useMemo(() => engine.getView(), [engine])
}
