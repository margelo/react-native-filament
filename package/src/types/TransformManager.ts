import { Entity } from './Entity'
import { Float3 } from './float3'

export interface Mat4f {
  readonly data: number[]
  readonly scale: Float3
  scaling(scale: Float3): Mat4f
}

export interface TransformManager {
  getTransform(entity: Entity): Mat4f
  getWorldTransform(entity: Entity): Mat4f
}
