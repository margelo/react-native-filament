import { Float3 } from '../../types/float3'
import { BulletAPI } from '../bulletApi'
import { ActivationState } from '../types/RigidBody'
import { useEffect, useMemo } from 'react'
import { BaseShape } from '../types/Shapes'
import { Mat4f } from '../../types/TransformManager'
import { DiscreteDynamicWorld } from '../types/DiscreteDynamicWorld'

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
} & (
  | {
      origin: Float3
    }
  | {
      transform: Mat4f
    }
)

export function useRigidBody(props: RigidBodyProps | undefined) {
  const originVec = props != null && 'origin' in props ? props.origin : undefined
  const transform = props != null && 'transform' in props ? props.transform : undefined
  const { mass, shape, friction, activationState, damping, world, id } = props ?? {}

  const originX = originVec?.[0]
  const originY = originVec?.[1]
  const originZ = originVec?.[2]

  const body = useMemo(() => {
    if (mass == null || shape == null) {
      return undefined
    }

    if (originX != null && originY != null && originZ != null) {
      return BulletAPI.createRigidBody(mass, originX, originY, originZ, shape)
    }
    if (transform) {
      return BulletAPI.createRigidBodyFromTransform(mass, transform, shape)
    }

    throw new Error('Either origin or transform must be provided')
  }, [mass, originX, originY, originZ, shape, transform])

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
    console.log('world.addRigidBody(body)')
    world.addRigidBody(body)
    return () => {
      // TODO: world.removeRigidBody(body)
    }
  }, [body, world])

  return body
}
