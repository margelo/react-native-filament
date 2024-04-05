import { useEffect } from 'react'
import { Platform } from 'react-native'
import { Engine, useAsset, useScene } from 'react-native-filament'

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

export function useDefaultLight(engine: Engine) {
  const lightBuffer = useAsset({ path: indirectLightPath })
  const scene = useScene(engine)

  useEffect(() => {
    if (lightBuffer == null) return
    engine.setIndirectLight(lightBuffer)
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    scene.addEntity(directionalLight)

    return () => {
      scene.removeEntity(directionalLight)
    }
  }, [engine, lightBuffer, scene])
}
