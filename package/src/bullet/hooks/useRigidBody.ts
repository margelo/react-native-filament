import { Float3 } from '../../types/float3'
import { BulletAPI } from '../bulletApi'
import { ActivationState } from '../types/RigidBody'
import { useEffect, useMemo } from 'react'
import { BaseShape } from '../types/Shapes'

export type RigidBodyProps = {
  mass: number
  origin: Float3
  shape: BaseShape
  friction?: number
  activationState?: ActivationState
  /** [linearDumping, angularDumping] */
  damping?: [number, number]
}

export function useRigidBody({ mass, origin, shape, friction, activationState, damping }: RigidBodyProps) {
  const [x, y, z] = origin

  const body = useMemo(() => {
    return BulletAPI.createRigidBody(mass, x, y, z, shape)
  }, [mass, shape, x, y, z])

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
