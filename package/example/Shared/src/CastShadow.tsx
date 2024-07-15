import * as React from 'react'
import { useEffect } from 'react'

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
  Animator,
  useEntityInScene,
} from 'react-native-filament'
import TransparentShadowMaterial from '~/assets/transparent_shadow_material.filamat'
import HipHopGirl from '~/assets/hiphopgirl.glb'

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
    // Note: Why is cast shadow here, it just needs to receive a shadow?!
    // Right now there seems to be a bug in filament, which would cause the shadow of the animated Pengu to be cut!
    // One solution would be to manually correct the bounding box when using the animator (because it seems like the bounding box isn't correctly
    // updated when using the animator). But, if the plane also casts a shadow, the shadow calculation extends to the bounding box of the plane,
    // thus fixing the cut shadow of the animated Pengu. The plane will never actually cast a shadow, as its using a transparent material.
    renderableManager.setCastShadow(entity, true)
    return entity
  }, [renderableManager, shadowMaterial])

  useEntityInScene(scene, shadowPlane)
  //#endregion

  const [showShadow, setShowShadow] = React.useState(false)

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView}>
        <DefaultLight />
        <Camera cameraPosition={[0, 1, 8]} />

        <Model source={HipHopGirl} scale={[1.5, 1.5, 1.5]}>
          <Animator animationIndex={1} />
        </Model>
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
