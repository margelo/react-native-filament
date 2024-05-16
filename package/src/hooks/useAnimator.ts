import { useMemo } from 'react'
import { Animator, FilamentAsset, FilamentInstance } from '../types'
import { useFilamentContext } from '../FilamentContext'

/**
 * Creates a animator for the given {@linkcode FilamentAsset} or {@linkcode FilamentInstance}.
 *
 * @note For each asset/instance you should only have one animator.
 */
export function useAnimator(asset?: FilamentAsset | FilamentInstance): Animator | undefined {
  const { nameComponentManager } = useFilamentContext()
  const animator = useMemo(() => asset?.createAnimator(nameComponentManager), [asset, nameComponentManager])
  return animator
}
