import type { HybridObject } from 'react-native-nitro-modules'
import type { ColorSpace } from '../types/ColorSpace'
import type { CullingMode } from '../types/CullingMode'
import type { Float3 } from '../types/Float3'
import type { Float4 } from '../types/Float4'
import type { SamplerOptions } from '../types/SamplerOptions'
import type { TransparencyMode } from '../types/TransparencyMode'
import type { Texture } from './Texture.nitro'

/**
 * Parameter values for a material. Every member runs on the render thread. Setting a parameter the
 * material does not declare, or with the wrong type, throws.
 */
export interface MaterialInstance extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Name of the instance; for a model, the glTF material name. */
  readonly instanceName: string
  /** Name of the material it was created from. For a model, gltfio's shared ubershader. */
  readonly materialName: string
  cullingMode: CullingMode
  transparencyMode: TransparencyMode
  hasParameter(name: string): boolean
  setFloatParameter(name: string, value: number): void
  setIntParameter(name: string, value: number): void
  setFloat3Parameter(name: string, value: Float3): void
  setFloat4Parameter(name: string, value: Float4): void
  /** An RGBA color, converted to linear when given in sRGB. */
  setColorParameter(name: string, color: Float4, colorSpace: ColorSpace): void
  getFloatParameter(name: string): number
  getIntParameter(name: string): number
  getFloat3Parameter(name: string): Float3
  getFloat4Parameter(name: string): Float4
  /** Binds a texture to a sampler parameter. The instance keeps the texture alive. */
  setTexture(name: string, texture: Texture, sampler: SamplerOptions): void
}
