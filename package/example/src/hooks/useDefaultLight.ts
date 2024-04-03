import { Platform } from 'react-native'
import { Engine, useAsset, useWorkletEffect } from 'react-native-filament'

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

export function useDefaultLight(engine: Engine) {
  const lightBuffer = useAsset({ path: indirectLightPath })

  useWorkletEffect(() => {
    'worklet'
    if (lightBuffer == null) return
    engine.setIndirectLight(lightBuffer)
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    engine.getScene().addEntity(directionalLight)
  }, [lightBuffer])
}
