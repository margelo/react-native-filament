import { useEffect } from 'react'
import { useFilamentContext } from '../FilamentContext'
import { FilamentBuffer } from '../native/FilamentBuffer'

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

export function useSkybox(options: SkyboxOptions) {
  const { engine } = useFilamentContext()

  const { showSun, envIntensity } = options
  const texture = 'texture' in options ? options.texture : undefined
  const color = 'color' in options ? options.color : undefined
  useEffect(() => {
    if (texture) {
      engine.createAndSetSkyboxByTexture(texture, showSun, envIntensity)
    } else if (color) {
      engine.createAndSetSkyboxByColor(color, showSun, envIntensity)
    }
  }, [engine, showSun, envIntensity, texture, color])
}
