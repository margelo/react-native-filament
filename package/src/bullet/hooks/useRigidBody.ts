import { Float3 } from '../../types/float3'
import { BulletAPI } from '../bulletApi'
import { ActivationState } from '../types/RigidBody'
import { useEffect, useMemo } from 'react'
import { BaseShape } from '../types/Shapes'
import { Mat4f } from '../../types/TransformManager'

export type RigidBodyProps = {
  mass: number
  shape: BaseShape
  friction?: number
  activationState?: ActivationState
  /** [linearDumping, angularDumping] */
  damping?: [number, number]
} & (
  | {
      origin: Float3
    }
  | {
      transform: Mat4f
    }
)

export function useRigidBody({ mass, shape, friction, activationState, damping, ...props }: RigidBodyProps) {
  const originVec = 'origin' in props ? props.origin : undefined
  const transform = 'transform' in props ? props.transform : undefined

  const body = useMemo(() => {
    if (originVec) {
      return BulletAPI.createRigidBody(mass, originVec[0], originVec[1], originVec[2], shape)
    }
    if (transform) {
      return BulletAPI.createRigidBodyFromTransform(mass, transform, shape)
    }

    throw new Error('Either origin or transform must be provided')
    // TODO: shape, origin and transform are not stable!
  }, [mass])

  useEffect(() => {
    if (friction != null) {
      body.friction = friction
    }
  }, [body, friction])

  useEffect(() => {
    if (activationState != null) {
      body.activationState = activationState
    }
  }, [body, activationState])

  useEffect(() => {
    if (damping != null) {
      body.setDamping(damping[0], damping[1])
    }
  }, [body, damping])

  return body
}
