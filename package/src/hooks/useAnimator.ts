import { useMemo } from 'react'
import { FilamentAnimator, FilamentAsset, FilamentInstance } from '../types'
import { useFilamentContext } from './useFilamentContext'
import { FilamentModel } from './useModel'

function isFilamentModel(asset: FilamentAsset | FilamentInstance | FilamentModel): asset is FilamentModel {
  // @ts-expect-error Because asset is a HostObject and using "in" check is a) expensive and b) somehow broken
  return asset.state != null
}

/**
 * Creates a animator for the given {@linkcode FilamentAsset} or {@linkcode FilamentInstance}.
 *
 * @note For each asset/instance you should only have one animator.
 */
export function useAnimator(modelOrAsset?: FilamentAsset | FilamentInstance | FilamentModel): FilamentAnimator | undefined {
  const { nameComponentManager } = useFilamentContext()
  const animator = useMemo(() => {
    if (modelOrAsset == null) return undefined

    if (isFilamentModel(modelOrAsset)) {
      if (modelOrAsset.state === 'loading') return undefined
      const { asset } = modelOrAsset
      return asset.unbox().createAnimator(nameComponentManager.unbox())
    }

    return modelOrAsset.createAnimator(nameComponentManager.unbox())
  }, [modelOrAsset, nameComponentManager])
  return animator
}
