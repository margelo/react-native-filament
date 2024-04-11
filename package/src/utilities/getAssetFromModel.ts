import { FilamentModel } from '../hooks/useModel'
import { FilamentAsset } from '../types'

/**
 * Helper function to unwrap model.asset from a filament model.
 */
export function getAssetFromModel(model: FilamentModel): FilamentAsset | undefined {
  return model.state === 'loaded' ? model.asset : undefined
}
