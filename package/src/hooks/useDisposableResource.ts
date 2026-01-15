import { DependencyList, useEffect, useRef, useState } from 'react'
import { withCleanupScope } from '../utilities/withCleanupScope'
import { PointerHolder } from '../types/PointerHolder'

type ReleasingResource = Pick<PointerHolder, 'release'>

const emptyStaticArray: DependencyList = []

export interface UseDisposableResourceOptions {
  /**
   * Whether to release the resource when the component unmounts.
   * @default true
   */
  releaseOnUnmount?: boolean
}

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
  deps?: DependencyList,
  options?: UseDisposableResourceOptions
): T | undefined => {
  const { releaseOnUnmount = true } = options ?? {}
  const [resource, setResource] = useState<T>()
  const tokenRef = useRef(0)

  useEffect(() => {
    const currentToken = ++tokenRef.current
    let isValid = true
    let currentAsset: T | undefined
    initialize()?.then((a) => {
      if (a == null) return

      if (currentToken !== tokenRef.current) {
        // This is a stale callback from a previous mount (e.g., StrictMode double-mount).
        // Don't call setResource() - we don't want to update state with stale data.
        // Don't call a.release() - it may interfere with resources in the new mount.
        //
        // Memory cleanup: The asset `a` will be released when:
        // 1. This callback returns and `a` goes out of scope
        // 2. JavaScript GC collects the Promise closure
        // 3. The prevented release triggers the C++ shared_ptr destructor
        return
      }

      if (isValid) {
        // this useEffect is still mounted
        setResource(a)
        currentAsset = a
      } else {
        // this useEffect has been unmounted already, drop the asset
        a.release()
      }
    })
    // TODO: catch is broken
    // .catch((e) => {
    //   console.error('Error while loading resource', e)
    // })
    return () => {
      setResource(undefined)
      isValid = false
      if (releaseOnUnmount) {
        withCleanupScope(() => {
          currentAsset?.release()
        })()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? emptyStaticArray)

  return resource
}
