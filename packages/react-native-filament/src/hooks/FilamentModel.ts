import type { Model } from '../specs/assets/Model.nitro'
import type { Aabb } from '../specs/types/Aabb'
import type { Entity } from '../specs/types/Entity'

/** A model from `useModel`: loading, or loaded with its native object. */
export type FilamentModel =
  | { state: 'loading' }
  | {
      state: 'loaded'
      model: Model
      boundingBox: Aabb
      rootEntity: Entity
    }
