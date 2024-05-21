import { useFilamentContext } from '../react/FilamentContext'
import { FilamentBuffer } from '../native/FilamentBuffer'
import { useWorkletEffect } from './useWorkletEffect'

export type SkyboxBaseOptions = {
  showSun?: boolean
  envIntensity?: number
}

export type SkyboxOptions = SkyboxBaseOptions &
  (
    | {
        color: string
      }
    | {
        texture: FilamentBuffer
      }
  )

/**
 * Creates and sets the skybox for the scene depending on the options provided.
 * If `null` is passed, the skybox will be removed.
 */
export function useSkybox(options?: SkyboxOptions | null) {
  const { engine } = useFilamentContext()

  const hasOptions = options != null

  const { showSun, envIntensity } = options ?? {}
  const texture = hasOptions && 'texture' in options ? options.texture : undefined
  const color = hasOptions && 'color' in options ? options.color : undefined

  useWorkletEffect(() => {
    'worklet'

    if (!hasOptions) {
      engine.clearSkybox()
      return
    }
    if (texture) {
      engine.createAndSetSkyboxByTexture(texture, showSun, envIntensity)
    } else if (color) {
      engine.createAndSetSkyboxByColor(color, showSun, envIntensity)
    }
  })
}
