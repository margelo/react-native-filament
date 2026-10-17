import { BufferSource, useBuffer } from '../hooks/useBuffer'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { useWorkletEffect } from '../hooks/useWorkletEffect'

export type EnvironmentalLightProps = {
  /**
   * The image to use as the environmental light. Expects a ktx file.
   */
  source: BufferSource
  /**
   * @default 30_000
   */
  intensity?: number
  /**
   * Number of spherical harmonics bands. Must be 1, 2 or 3.
   * @default 3
   */
  irradianceBands?: number
}

/**
 * Sets the light of the scene. An environmental light uses an image file to simulate indirect light.
 * @note You can only have one environmental light in the scene.
 */
export function EnvironmentalLight({ source, intensity = 25_000, irradianceBands }: EnvironmentalLightProps) {
  const { engine } = useFilamentContext()
  const lightBuffer = useBuffer({ source: source, releaseOnUnmount: false })

  useWorkletEffect(() => {
    'worklet'

    if (lightBuffer == null) return
    engine.setIndirectLight(lightBuffer, intensity, irradianceBands)
    lightBuffer.release()
  })

  return null
}
