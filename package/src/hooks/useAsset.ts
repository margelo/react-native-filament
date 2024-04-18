import { Asset } from '../native/FilamentBuffer'
import { FilamentProxy } from '../native/FilamentProxy'
import { useResource } from './useResource'

export interface AssetProps {
  /**
   * A web URL (http:// or https://), local file (file://) or resource ID of the bundled asset.
   */
  path: string
}

/**
 * Asynchronously load an asset from the given web URL, local file path, or resource ID.
 */
export function useAsset({ path }: AssetProps): Asset | undefined {
  return useResource(() => FilamentProxy.loadAsset(path), [path])
}
