import React from 'react'
import { StyleSheet } from 'react-native'
import { useFrameCallback, useSharedValue } from 'react-native-reanimated'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, ModelInstance, Skybox, type Float3 } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')

function Renderer() {
  const rotation = useSharedValue<Float3>([0, 0, 0])
  useFrameCallback(() => {
    rotation.value = [0, (rotation.value[1] + 0.01) % (Math.PI * 2), 0]
  })

  return (
    <FilamentView style={styles.container}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />
      <Model source={drone} transformToUnitCube scale={[3, 3, 3]}>
        <ModelInstance index={0} rotate={rotation} />
      </Model>
    </FilamentView>
  )
}

export function AnimatedRotateSharedValues() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
