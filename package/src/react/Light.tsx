import { UseLightEntityProps, useLightEntity } from '../hooks/useLightEntity'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { useEntityInScene } from '../hooks/useEntityInScene'

export type LightProps = UseLightEntityProps

export function Light(config: LightProps) {
  const { lightManager, scene } = useFilamentContext()

  const lightEntity = useLightEntity(lightManager, config)
  useEntityInScene(scene, lightEntity)

  return null
}
