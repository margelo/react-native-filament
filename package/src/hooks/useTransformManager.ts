import { useMemo } from 'react'
import { Engine } from '../types'
import { TransformManager } from '../types/TransformManager'

export function useTransformManager(engine: Engine): TransformManager {
  return useMemo(() => engine.transformManager, [engine])
}
