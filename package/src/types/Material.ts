import { MaterialInstance } from './MaterialInstance'

export interface Material {
  createInstance(): MaterialInstance
  getDefaultInstance(): MaterialInstance
  setDefaultParameter(name: string, value: number): void
}
