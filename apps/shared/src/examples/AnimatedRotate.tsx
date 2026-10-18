import React, { useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  ModelRenderer,
  quaternionFromAxisAngle,
  Skybox,
  unitCubeTransform,
  useModel,
  useTransformBinding,
  type FrameInfo,
} from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')
const radiansPerSecond = 0.6

function Renderer() {
  const model = useModel(drone)
  const loaded = model.state === 'loaded' ? model : undefined
  const binding = useTransformBinding(loaded?.rootEntity)
  const base = useMemo(() => (loaded == null ? undefined : unitCubeTransform(loaded.boundingBox)), [loaded])

  const renderCallback = useCallback(
    ({ elapsedSeconds }: FrameInfo) => {
      'worklet'
      if (binding == null || base == null) return
      const [x, y, z, w] = quaternionFromAxisAngle([0, 1, 0], elapsedSeconds * radiansPerSecond)
      binding.setBase(base)
      binding.setScale(3, 3, 3)
      binding.setRotation(x, y, z, w)
    },
    [binding, base]
  )

  return (
    <FilamentView style={styles.container} renderCallback={renderCallback}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />
      <ModelRenderer model={model} />
    </FilamentView>
  )
}

export function AnimatedRotate() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
