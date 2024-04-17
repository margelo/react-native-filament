import { MaterialInstance } from './MaterialInstance'
import { PointerHolder } from './PointerHolder'

export interface Material extends PointerHolder {
  createInstance(): MaterialInstance
  getDefaultInstance(): MaterialInstance
  setDefaultParameter(name: string, value: number): void
}
