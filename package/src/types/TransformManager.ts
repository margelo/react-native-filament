import { Entity } from './Entity'

export interface TransformManager {
  getTransform(entity: Entity): number
}
