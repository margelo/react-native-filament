import { useEffect, useMemo } from 'react'
import { Animator, FilamentAsset } from '../types'

export function useAssetAnimator(asset?: FilamentAsset): Animator | undefined {
  const animator = useMemo(() => asset?.getAnimator(), [asset])

  // Release native memory when the component unmounts
  useEffect(() => {
    return () => {
      animator?.release()
    }
  }, [animator])

  return animator
}
