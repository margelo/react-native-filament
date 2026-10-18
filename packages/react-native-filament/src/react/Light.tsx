import { useEntityInScene } from '../hooks/useEntityInScene'
import type { LightConfig } from '../hooks/LightConfig'
import { useLightEntity } from '../hooks/useLightEntity'
import { useFilamentScene } from './useFilamentScene'
import type { Light as NativeLight } from '../specs/scene/Light.nitro'

export type LightProps = LightConfig

/** A light in the scene of the closest `FilamentScene`, disposed on unmount. */
export function Light(props: LightProps) {
  const { scene } = useFilamentScene()
  const light = useLightEntity(props)
  useEntityInScene(scene, light?.entity)
  return null
}

/** A light entity, as `useLightEntity` and the `engine.create*Light` methods return it. */
export type Light = NativeLight
