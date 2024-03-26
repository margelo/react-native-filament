import { MaterialInstance } from './MaterialInstance'

export interface Material {
  createInstance(): MaterialInstance
}
