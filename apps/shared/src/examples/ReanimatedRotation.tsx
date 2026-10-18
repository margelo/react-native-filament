import React, { useCallback } from 'react'
import { Button, StyleSheet } from 'react-native'
import { useDerivedValue, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, ModelInstance, Skybox, type Float3 } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')
const scale: Float3 = [3, 3, 3]

function Renderer() {
  const rotationY = useSharedValue(0)
  const rotation = useDerivedValue<Float3>(() => [0, rotationY.value, 0])
  const spin = useCallback(() => {
    rotationY.value = withSequence(withSpring(Math.PI * 2), withTiming(0, { duration: 0 }))
  }, [rotationY])

  return (
    <>
      <Button title="Spin" onPress={spin} />
      <FilamentView style={styles.container}>
        <Camera />
        <DefaultLight />
        <Skybox colorInHex="#88defb" />
        <Model source={drone} transformToUnitCube>
          <ModelInstance index={0} rotate={rotation} scale={scale} />
        </Model>
      </FilamentView>
    </>
  )
}

export function ReanimatedRotation() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
