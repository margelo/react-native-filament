import { Float3 } from '../../types/Math'
import { BulletAPI } from '../bulletApi'
import { ActivationState, CollisionCallback, RigidBody } from '../types/RigidBody.nitro'
import { useEffect, useState } from 'react'
import { BaseShape } from '../types/Shapes.nitro'
import { Mat4 } from '../../types/TransformManager.nitro'
import { DiscreteDynamicWorld } from '../types/DiscreteDynamicWorld.nitro'
import { FilamentWorkletContext } from '../../native/FilamentProxy'

export type RigidBodyProps = {
  mass: number
  shape: BaseShape
  friction?: number
  activationState?: ActivationState
  /** [linearDumping, angularDumping] */
  damping?: [number, number]
  /**
   * If you supply world the rigid body will be added to the world on mount and removed on unmount.
   */
  world?: DiscreteDynamicWorld
  id: string
  collisionCallback?: CollisionCallback
} & (
  | {
      origin: Float3
    }
  | {
      transform: Mat4
    }
)

export function useRigidBody(props: RigidBodyProps | undefined) {
  const originVec = props != null && 'origin' in props ? props.origin : undefined
  const transform = props != null && 'transform' in props ? props.transform : undefined
  const { mass, shape, friction, activationState, damping, world, id, collisionCallback } = props ?? {}

  const originX = originVec?.[0]
  const originY = originVec?.[1]
  const originZ = originVec?.[2]

  const [body, setBody] = useState<RigidBody>()

  useEffect(() => {
    if (mass == null || shape == null || id == null) {
      return
    }
    const getBody = FilamentWorkletContext.runAsync(() => {
      'worklet'

      if (originX != null && originY != null && originZ != null) {
        return BulletAPI.createRigidBody(mass, originX, originY, originZ, shape, id, collisionCallback)
      }
      if (transform) {
        return BulletAPI.createRigidBodyFromTransform(mass, transform, shape, id, collisionCallback)
      }
      throw new Error('Either origin or transform must be provided')
    })

    getBody.then(setBody)
  }, [id, mass, originX, originY, originZ, collisionCallback, shape, transform])

  useEffect(() => {
    if (friction == null || body == null) {
      return
    }
    body.friction = friction
  }, [body, friction])

  useEffect(() => {
    if (activationState == null || body == null) {
      return
    }
    body.activationState = activationState
  }, [body, activationState])

  useEffect(() => {
    if (damping == null || body == null) {
      return
    }
    body.setDamping(damping[0], damping[1])
  }, [body, damping])

  useEffect(() => {
    if (world == null || body == null) {
      return
    }
    world.addRigidBody(body)
    return () => {
      world.removeRigidBody(body)
    }
  }, [body, world])

  return body
}
