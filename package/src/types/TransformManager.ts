import { Entity } from './Entity'

export interface Mat4f {
  _type: 'mat4f'
  readonly data: number[]
}

export interface TransformManager {
  getTransform(entity: Entity): Mat4f
  getWorldTransform(entity: Entity): Mat4f
}
