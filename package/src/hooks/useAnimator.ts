import { useMemo } from 'react'
import { Animator, FilamentAsset, FilamentInstance } from '../types'
import { useFilamentContext } from '../FilamentContext'
import { FilamentModel } from './useModel'

/**
 * Creates a animator for the given {@linkcode FilamentAsset} or {@linkcode FilamentInstance}.
 *
 * @note For each asset/instance you should only have one animator.
 */
export function useAnimator(asset?: FilamentAsset | FilamentInstance | FilamentModel): Animator | undefined {
  const { nameComponentManager } = useFilamentContext()
  const animator = useMemo(() => {
    if (asset == null) return undefined
    if ('state' in asset) {
      if (asset.state === 'loading') return undefined
      const modelAsset = asset.asset
      return modelAsset.createAnimator(nameComponentManager)
    }

    return asset.createAnimator(nameComponentManager)
  }, [asset, nameComponentManager])
  return animator
}
