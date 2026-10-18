import type { SkyboxOptions } from '../hooks/SkyboxOptions'
import { useSkybox } from '../hooks/useSkybox'
import type { Skybox as NativeSkybox } from '../specs/scene/Skybox.nitro'

export type SkyboxProps = SkyboxOptions

/** The background of the scene of the closest `FilamentScene`. */
export function Skybox(props: SkyboxProps) {
  useSkybox(props)
  return null
}

/** The background of a scene. */
export type Skybox = NativeSkybox
