import { Float3 } from '../../types/float3'
import { BulletAPI } from '../bulletApi'
import { ActivationState } from '../types/RigidBody'
import { useEffect, useMemo } from 'react'

export type RigidBodyProps = {
  mass: number
  origin: Float3
  shape: Float3
  friction?: number
  activationState?: ActivationState
  /** [linearDumping, angularDumping] */
  damping?: [number, number]
}

export function useRigidBody({ mass, origin, shape, friction, activationState, damping }: RigidBodyProps) {
  const [x, y, z] = origin
  const [shapeX, shapeY, shapeZ] = shape

  const body = useMemo(() => {
    return BulletAPI.createRigidBody(mass, x, y, z, shapeX, shapeY, shapeZ)
  }, [mass, shapeX, shapeY, shapeZ, x, y, z])

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
