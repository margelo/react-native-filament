import { useMemo } from 'react'
import type { Engine } from '../types'
import { FilamentProxy } from '../native/FilamentProxy'

export function useEngine(): Engine {
  const engine = useMemo(() => FilamentProxy.createEngine(), [])
  return engine
}
