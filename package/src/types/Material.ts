import type { MaterialInstance } from './MaterialInstance'
import type { RGBA } from './Color'
import type { PointerHolder } from './PointerHolder'
import type { RenderableManager } from './RenderableManager'
import type { FilamentBuffer } from '../native/FilamentBuffer'
import type { TextureFlags } from './TextureFlags'
import type { Mat3f } from './Math'

export interface TextureInfo {
  width: number
  height: number
}

export interface Material extends PointerHolder {
  createInstance(): MaterialInstance
  getDefaultInstance(): MaterialInstance
  setDefaultIntParameter(name: string, value: number): void
  setDefaultFloatParameter(name: string, value: number): void
  setDefaultTextureParameter(
    renderableManager: RenderableManager,
    name: string,
    textureBuffer: FilamentBuffer,
    textureFlags: TextureFlags
  ): TextureInfo
  setDefaultMat3fParameter(name: string, value: Mat3f): void
  /**
   * Changes the base color of the material.
   * Assumes linear (0-1) linear sRGB color space.
   */
  setBaseColorSRGB(color: RGBA): void
  readonly name: string
}
