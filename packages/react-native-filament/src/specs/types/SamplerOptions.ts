export type SamplerMinFilter =
  | 'nearest'
  | 'linear'
  | 'nearest-mipmap-nearest'
  | 'linear-mipmap-nearest'
  | 'nearest-mipmap-linear'
  | 'linear-mipmap-linear'
export type SamplerMagFilter = 'nearest' | 'linear'
export type SamplerWrapMode = 'clamp-to-edge' | 'repeat' | 'mirrored-repeat'

export interface SamplerOptions {
  /** @default 'linear-mipmap-linear' */
  minFilter?: SamplerMinFilter
  /** @default 'linear' */
  magFilter?: SamplerMagFilter
  /** @default 'repeat' */
  wrapS?: SamplerWrapMode
  /** @default 'repeat' */
  wrapT?: SamplerWrapMode
}
