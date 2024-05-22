import { InteractionManager } from 'react-native'

/**
 * Operations that are releasing memory from JS should be executed after cleanup functions
 * that are still operating on the resource.
 * For example in a cleanup you might remove an asset from the scene, but you also want to release the memory of the asset.
 * The memory release() function call should be wrapped with withCleanupScope.
 *
 * @note You probably don't need to call this yourself!
 *
 * @example
 *
 * ```ts
 * useEffect(() => {
 *  const asset = // ... acquire some resources
 *
 *   return withCleanupScope(() => {
 *     asset.release()
 *   })
 * })
 * ```
 */
export function withCleanupScope(cleanupFunction: Function) {
  return () => {
    // runAfterInteractions to make sure its called after all children have run their cleanup and all interactions are done
    InteractionManager.runAfterInteractions(() => {
      // Cleanup in worklets context, as cleanup functions might also use the worklet context
      // and we want to queue our cleanup after all other worklets have run
      setTimeout(() => {
        cleanupFunction()
      }, 0)
    })
  }
}
