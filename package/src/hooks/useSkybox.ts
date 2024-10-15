import { useFilamentContext } from './useFilamentContext'
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

    const unboxedEngine = engine.unbox()

    if (!hasOptions) {
      unboxedEngine.clearSkybox()
      return
    }
    if (texture) {
      unboxedEngine.createAndSetSkyboxByTexture(texture, showSun, envIntensity)
    } else if (color) {
      unboxedEngine.createAndSetSkyboxByColor(color, showSun, envIntensity)
    }
  })
}
