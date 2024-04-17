import { InteractionManager } from 'react-native'

/**
 * Operations that are releasing memory from JS should be executed after cleanup functions
 * that are still operating on the resource.
 * For example in a cleanup you might remove an asset from the scene, but you also want to release the memory of the asset.
 * The memory release() function call should be wrapped with prepareForCleanup.
 *
 * @note You probably don't need to call this yourself!
 */
export function prepareForCleanup(cleanupFunction: Function) {
  return () => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        cleanupFunction()
      }, 0)
    })
  }
}
