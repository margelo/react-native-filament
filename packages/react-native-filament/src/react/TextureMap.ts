import type { AssetLike } from '../assets/AssetLike'

/** Replaces the `baseColorMap` of the entity's material instances named `materialName`. */
export interface TextureMap {
  materialName: string
  /** A PNG, JPEG or KTX2 image. */
  textureSource: AssetLike
  /** @default true */
  srgb?: boolean
}
