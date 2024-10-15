import { DependencyList, useEffect, useState } from 'react'
import { withCleanupScope } from '../utilities/withCleanupScope'
import { PointerHolder } from '../types/PointerHolder'
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/BoxedHybridObject'

const emptyStaticArray: DependencyList = []

function isBoxed(obj: any): obj is BoxedHybridObject<PointerHolder> {
  return obj.unbox != null
}

/**
 * Any resource that is a {@link PointerHolder} and can be released, should be loaded
 * using this hook. It takes care of properly releasing the resource when the component
 * unmounts or dependencies change.
 * There are certain cases like "fast refresh" or StrictMode that make useEffects execute
 * multiple times. Also loading the resource can be async and this hooks handles all these
 * cases properly.
 */
export const useDisposableResource = <T extends PointerHolder | BoxedHybridObject<PointerHolder>>(
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
        if (isBoxed(a)){
          const unboxed = a.unbox()
          unboxed.release()
        } else {
          a.release()
        }
      }
    })
    // TODO: catch is broken
    // .catch((e) => {
    //   console.error('Error while loading resource', e)
    // })
    return () => {
      setResource(undefined)
      isValid = false
      withCleanupScope(() => {
        if (currentAsset == null) return
        if (isBoxed(currentAsset)) {
          const unboxed = currentAsset.unbox()
          unboxed.release()
        } else {
          currentAsset.release()
        }
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? emptyStaticArray)

  return resource
}
