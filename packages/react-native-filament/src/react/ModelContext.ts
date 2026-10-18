import { createContext } from 'react'
import type { Model } from '../specs/assets/Model.nitro'
import type { ModelInstance } from '../specs/assets/ModelInstance.nitro'
import type { Entity } from '../specs/types/Entity'

export interface ModelContextValue {
  model: Model
  /** The instances the children configure: every instance under `Model`, one under `ModelInstance`. */
  instances: ModelInstance[]
  /** Entity the children attach to: the model's root under `Model`, the instance's under `ModelInstance`. */
  rootEntity: Entity
}

export const ModelContext = createContext<ModelContextValue | undefined>(undefined)
