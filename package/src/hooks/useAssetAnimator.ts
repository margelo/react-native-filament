import { useMemo } from 'react'
import { Animator, FilamentAsset } from '../types'

export function useAssetAnimator(asset?: FilamentAsset): Animator | undefined {
  const animator = useMemo(() => asset?.createAnimator(), [asset])
  return animator
}
