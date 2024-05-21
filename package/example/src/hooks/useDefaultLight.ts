import { useBuffer, useEntityInScene, useFilamentContext, useLightEntity, useWorkletEffect } from 'react-native-filament'
import DefaultLightIBL from '../../assets/default_env_ibl.ktx'

/**
 * @deprecated use `<DefaultLights />` instead. (delete once migrated)
 */
export function useDefaultLight(enableDirectionalLight = true) {
  const lightBuffer = useBuffer({ source: DefaultLightIBL, releaseOnUnmount: false })
  const { engine, scene, lightManager } = useFilamentContext()

  useWorkletEffect(() => {
    'worklet'

    if (lightBuffer == null) return
    engine.setIndirectLight(lightBuffer, 25_000, undefined)
    lightBuffer.release()
  })

  const directionalLight = useLightEntity(lightManager, {
    type: 'directional',
    castShadows: true,
    colorKelvin: 6_500,
    direction: [0, -1, 0],
    intensity: enableDirectionalLight ? 10_000 : 0,
    position: [0, 0, 0],
  })
  useEntityInScene(scene, directionalLight)
}
