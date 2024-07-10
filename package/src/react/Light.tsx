import { UseLightEntityProps, useLightEntity } from '../hooks/useLightEntity'
import { useFilamentContext } from './Context'
import { useEntityInScene } from '../hooks/useEntityInScene'

export type LightProps = UseLightEntityProps

export function Light(config: LightProps) {
  const { lightManager, scene } = useFilamentContext()

  const lightEntity = useLightEntity(lightManager, config)
  useEntityInScene(scene, lightEntity)

  return null
}
