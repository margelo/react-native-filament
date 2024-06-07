import React, { PropsWithChildren } from 'react'
import { UseLightEntityProps, useLightEntity } from '../hooks/useLightEntity'
import { useFilamentContext } from './Context'
import { ParentEntityContext } from './ParentEntityContex'
import { useEntityInScene } from '../hooks/useEntityInScene'

export type LightProps = PropsWithChildren<UseLightEntityProps>

export function Light({ children, ...config }: LightProps) {
  const { lightManager, scene } = useFilamentContext()

  const lightEntity = useLightEntity(lightManager, config)
  useEntityInScene(scene, lightEntity)

  return <ParentEntityContext.Provider value={lightEntity}>{children}</ParentEntityContext.Provider>
}
