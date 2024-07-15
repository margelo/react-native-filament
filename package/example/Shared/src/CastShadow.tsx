import * as React from 'react'

import { Button, StyleSheet, View } from 'react-native'
import {
  FilamentView,
  useBuffer,
  useFilamentContext,
  FilamentScene,
  useDisposableResource,
  useWorkletCallback,
  useWorkletMemo,
  DefaultLight,
  Camera,
  Model,
  useEntityInScene,
} from 'react-native-filament'
import TransparentShadowMaterial from '~/assets/transparent_shadow_material.filamat'
import Coin from '~/assets/coin.glb'

function Renderer() {
  const { engine, renderableManager, scene } = useFilamentContext()

  //#region Setup shadow plane
  const shadowMaterialBuffer = useBuffer({ source: TransparentShadowMaterial })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shadowMaterial = useDisposableResource(
    useWorkletCallback(() => {
      'worklet'
      if (shadowMaterialBuffer == null) return undefined

      const material = engine.createMaterial(shadowMaterialBuffer)
      material.setDefaultFloatParameter('strength', 0.2)
      return material
    }),
    [engine, shadowMaterialBuffer]
  )

  // Create Shadow plane
  const shadowPlane = useWorkletMemo(() => {
    'worklet'
    if (shadowMaterial == null) return undefined

    const entity = renderableManager.createPlane(shadowMaterial, 10, 0.0001, 10)
    renderableManager.setReceiveShadow(entity, true)
    return entity
  }, [renderableManager, shadowMaterial])

  useEntityInScene(scene, shadowPlane)
  //#endregion

  const [showShadow, setShowShadow] = React.useState(true)

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView}>
        <DefaultLight />

        {/* Elevate the camera bit so we can see the shadow (the plane is on 0,0,0, so we wouldn't see any shadow if we didn't elevate) */}
        <Camera cameraPosition={[0, 3, 8]} />

        <Model source={Coin} castShadow={showShadow} receiveShadow={showShadow} position={[0, 2, 0]} />
      </FilamentView>
      <Button title={`Toggle Shadow (${showShadow ? 'enabled' : 'disabled'})`} onPress={() => setShowShadow((prev) => !prev)} />
    </View>
  )
}

export function CastShadow() {
  const [isSSAOEnabled, setIsSSAOEnabled] = React.useState(false)

  return (
    <FilamentScene ambientOcclusionOptions={{ enabled: isSSAOEnabled }}>
      <Renderer />
      <Button title={`Toggle SSAO (${isSSAOEnabled ? 'enabled' : 'disabled'})`} onPress={() => setIsSSAOEnabled((prev) => !prev)} />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
