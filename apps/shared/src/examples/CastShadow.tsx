import React, { useState } from 'react'
import { Button, Image, StyleSheet, View } from 'react-native'
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  Model,
  useDisposableResource,
  useEntityInScene,
  useFilamentContext,
  useRenderThreadCallback,
} from 'react-native-filament'

const shadowMaterialSource = Image.resolveAssetSource(require('../../assets/transparent_shadow_material.filamat'))
const coin = require('../../assets/coin.glb')

function ShadowPlane() {
  const { engine, scene } = useFilamentContext()
  const shadowMaterial = useDisposableResource(() => engine.loadMaterial({ uri: shadowMaterialSource.uri }), [engine])
  const createPlane = useRenderThreadCallback(() => {
    'worklet'
    const instance = shadowMaterial!.createInstance()
    instance.setFloatParameter('strength', 0.2)
    return engine.createPlane({ width: 10, depth: 10 }, instance)
  }, [engine, shadowMaterial])
  const plane = useDisposableResource(() => (shadowMaterial == null ? undefined : createPlane()), [shadowMaterial, createPlane])
  useEntityInScene(scene, plane?.entity)
  return null
}

function Renderer({ ambientOcclusion }: { ambientOcclusion: boolean }) {
  const [showShadow, setShowShadow] = useState(true)
  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} transparent shadowType="vsm" ambientOcclusionOptions={{ enabled: ambientOcclusion }}>
        <DefaultLight />
        <Camera cameraPosition={[0, 3, 8]} />
        <ShadowPlane />
        <Model source={coin} castShadow={showShadow} receiveShadow={showShadow} translate={[0, 2, 0]} />
      </FilamentView>
      <Button title={`Toggle Shadow (${showShadow ? 'enabled' : 'disabled'})`} onPress={() => setShowShadow((previous) => !previous)} />
    </View>
  )
}

export function CastShadow() {
  const [isSSAOEnabled, setIsSSAOEnabled] = useState(false)
  return (
    <FilamentScene>
      <Renderer ambientOcclusion={isSSAOEnabled} />
      <Button title={`Toggle SSAO (${isSSAOEnabled ? 'enabled' : 'disabled'})`} onPress={() => setIsSSAOEnabled((previous) => !previous)} />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filamentView: { flex: 1, backgroundColor: 'lightblue' },
})
