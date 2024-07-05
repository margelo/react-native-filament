import React from 'react'
import { BufferSource, useBuffer } from '../hooks/useBuffer'
import { useSkybox } from '../hooks/useSkybox'
import { FilamentBuffer } from '../native/FilamentBuffer'

type BaseProps = {
  /**
   * Indicates whether the sun should be rendered. The sun can only be
   * rendered if there is at least one light of type SUN in the scene.
   * @default false
   */
  showSun?: boolean
  /**
   * Skybox intensity when no IndirectLight is set on the Scene.
   * This call is ignored when an IndirectLight is set on the Scene, and the intensity
   * of the IndirectLight is used instead.
   * Scale factor applied to the skybox texel values such that
   * the result is in lux, or lumen/m^2 (default = 30000)
   */
  envIntensity?: number
}

type TextureProps = BaseProps & {
  /**
   * The image to use as the skybox.
   */
  source: BufferSource
}

type ColorProps = BaseProps & {
  /**
   * The color of the skybox.
   * @example #ff0000
   */
  colorInHex: string
}

export type SkyboxProps = TextureProps | ColorProps

export function Skybox(props: SkyboxProps) {
  if ('colorInHex' in props) {
    return <SkyboxByColor {...props} />
  }
  return <SkyboxBySource {...props} />
}

function SkyboxByColor(props: ColorProps) {
  useSkybox({
    showSun: props.showSun,
    envIntensity: props.envIntensity,
    color: props.colorInHex,
  })

  return null
}

function SkyboxBySource(props: TextureProps) {
  const textureBuffer = useBuffer({ source: props.source, releaseOnUnmount: false })

  if (textureBuffer == null) return null
  return <SkyboxByLoadedBuffer {...props} buffer={textureBuffer} />
}

type LoadedTextureProps = BaseProps & {
  /**
   * The image to use as the skybox.
   */
  buffer: FilamentBuffer
}
function SkyboxByLoadedBuffer(props: LoadedTextureProps) {
  useSkybox({
    showSun: props.showSun,
    envIntensity: props.envIntensity,
    texture: props.buffer,
  })

  return null
}
