import { useEffect, useMemo } from 'react'
import { AssetProps, useAsset } from './useAsset'
import { Animator, Engine } from '../types'
import { FilamentAsset } from '../types/FilamentAsset'

interface ModelProps extends AssetProps {
  /**
   * The Filament engine this model should be loaded into.
   */
  engine: Engine
  /**
   * Whether source data of the model should be released after loading, or not.
   * @default true
   */
  shouldReleaseSourceData?: boolean
}

/**
 * The resulting filament model, or `'loading'` if not yet available.
 */
export type FilamentModel =
  | {
      state: 'loaded'
      animator: Animator
      asset: FilamentAsset
    }
  | {
      state: 'loading'
    }

/**
 * Use a Filament Model that gets asynchronously loaded into the given Engine.
 * @example
 * ```ts
 * const engine = useEngine()
 * const pengu = useModel({ engine: engine, path: PENGU_PATH })
 * ```
 */
export function useModel({ path, engine, shouldReleaseSourceData }: ModelProps): FilamentModel {
  const asset = useAsset({ path: path })

  const engineAsset = useMemo(() => {
    if (asset == null) return undefined
    return engine.loadAsset(asset)
  }, [asset, engine])

  const animator = useMemo(() => engineAsset?.getAnimator(), [engineAsset])

  useEffect(() => {
    if (shouldReleaseSourceData) {
      // releases CPU memory for bindings
      engineAsset?.releaseSourceData()
    }
  }, [engineAsset, shouldReleaseSourceData])

  if (asset == null || engineAsset == null || animator == null) {
    return {
      state: 'loading',
    }
  }
  return {
    state: 'loaded',
    asset: engineAsset,
    animator: animator,
  }
}
