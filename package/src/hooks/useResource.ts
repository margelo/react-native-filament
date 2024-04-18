import { useEffect, useState } from 'react'
import { withCleanupScope } from '../utilities/withCleanupScope'

type Base = {
  release: () => void
}

export const useResource = <T extends Base>(initialize: () => Promise<T>): T | undefined => {
  const [asset, setAsset] = useState<T>()

  useEffect(() => {
    let isValid = true
    let currentAsset: T | undefined
    initialize().then((a) => {
      if (isValid) {
        // this useEffect is still mounted
        setAsset(a)
        currentAsset = a
      } else {
        // this useEffect has been unmounted already, drop the asset
        a.release()
      }
    })
    return () => {
      setAsset(undefined)
      isValid = false
      withCleanupScope(() => {
        currentAsset?.release()
      })
    }
  }, [initialize])

  return asset
}
