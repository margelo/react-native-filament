import { MaterialInstance } from './MaterialInstance'
import { RGBA } from './Color'
import { PointerHolder } from './PointerHolder'

export interface Material extends PointerHolder {
  createInstance(): MaterialInstance
  getDefaultInstance(): MaterialInstance
  setDefaultParameter(name: string, value: number): void
  /**
   * Changes the base color of the material.
   * Assumes linear (0-1) linear sRGB color space.
   */
  setBaseColorSRGB(color: RGBA): void
}
