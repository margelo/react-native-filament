import type { AssetLike } from '../assets/AssetLike'
import { useIndirectLight } from '../hooks/useIndirectLight'

export interface EnvironmentalLightProps {
  /** A KTX1 cubemap with spherical harmonics, as `cmgen` writes it. */
  source: AssetLike
  /** Brightness scale in lux. @default 25000 */
  intensity?: number
}

/** Image-based lighting for the scene of the closest `FilamentScene`. */
export function EnvironmentalLight({ source, intensity = 25_000 }: EnvironmentalLightProps) {
  useIndirectLight(source, intensity)
  return null
}
