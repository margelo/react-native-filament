import { useEffect } from 'react'
import { Entity, Scene } from '../types'

/**
 * A hook that "on mount" adds the entity to the scene, and "on unmount" removes it.
 */
export function useEntityInScene(scene: Scene, entity?: Entity, id?: string) {
  useEffect(() => {
    if (entity == null) return
    scene.addEntity(entity)

    return () => {
      console.log('Removing entity from scene on', id)
      scene.removeEntity(entity)
    }
  }, [entity, scene])
}
