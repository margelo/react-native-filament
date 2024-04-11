import { useMemo } from 'react'
import { Animator, FilamentAsset } from '../types'

export function useAssetAnimator(asset?: FilamentAsset): Animator | undefined {
  return useMemo(() => asset?.getAnimator(), [asset])
}
