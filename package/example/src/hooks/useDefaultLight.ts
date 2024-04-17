import { Platform } from 'react-native'
import { useAsset, useEntityInScene, useFilamentContext, useLightEntity, useWorkletEffect } from 'react-native-filament'

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

export function useDefaultLight(enableDirectionalLight = true) {
  const lightBuffer = useAsset({ path: indirectLightPath })
  const { engine, scene, lightManager } = useFilamentContext()

  useWorkletEffect(() => {
    'worklet'

    if (lightBuffer == null) return
    engine.setIndirectLight(lightBuffer, 25_000, undefined)
  }, [engine, lightBuffer])

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
