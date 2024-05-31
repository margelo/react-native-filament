import { DependencyList, useEffect, useState } from 'react'
import { withCleanupScope } from '../utilities/withCleanupScope'
import { PointerHolder } from '../types/PointerHolder'

type ReleasingResource = Pick<PointerHolder, 'release'>

const emptyStaticArray: DependencyList = []

/**
 * Any resource that is a {@link PointerHolder} and can be released, should be loaded
 * using this hook. It takes care of properly releasing the resource when the component
 * unmounts or dependencies change.
 * There are certain cases like "fast refresh" or StrictMode that make useEffects execute
 * multiple times. Also loading the resource can be async and this hooks handles all these
 * cases properly.
 */
export const useDisposableResource = <T extends ReleasingResource>(
  initialize: () => Promise<T | undefined> | undefined,
  deps?: DependencyList
): T | undefined => {
  const [resource, setResource] = useState<T>()

  useEffect(() => {
    let isValid = true
    let currentAsset: T | undefined
    initialize()?.then((a) => {
      if (a == null) return

      if (isValid) {
        // this useEffect is still mounted
        setResource(a)
        currentAsset = a
      } else {
        // this useEffect has been unmounted already, drop the asset
        a.release()
      }
    })
    return () => {
      setResource(undefined)
      isValid = false
      withCleanupScope(() => {
        currentAsset?.release()
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? emptyStaticArray)

  return resource
}
