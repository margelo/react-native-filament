import * as React from 'react'
import { Button, StyleSheet } from 'react-native'
import {
  FilamentScene,
  FilamentView,
  Camera,
  Skybox,
  DefaultLight,
  Model,
  ModelInstance,
  Float3,
  useSyncSharedValue,
  useDerivedValue,
} from 'react-native-filament'
import DroneGlb from '@assets/buster_drone.glb'
import { useCallback } from 'react'
import { useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { Worklets } from 'react-native-worklets-core'

const scale = Worklets.createSharedValue<Float3>([3, 3, 3])

function Renderer() {
  const animatedRotationY = useSharedValue(0)
  const rotationY = useSyncSharedValue(animatedRotationY)
  const rotation = useDerivedValue<Float3>(() => {
    'worklet'
    return [0, rotationY.value, 0]
  })

  const spin = useCallback(() => {
    animatedRotationY.value = withSequence(withSpring(Math.PI * 2), withTiming(0, { duration: 0 }))
  }, [animatedRotationY])

  return (
    <>
      <Button title="Spin" onPress={spin} />
      <FilamentView style={styles.filamentView} enableTransparentRendering={false}>
        <Camera />
        <DefaultLight />
        <Skybox colorInHex="#88defb" />

        <Model source={DroneGlb} transformToUnitCube>
          {/* Note: we apply the rotation individually as the above transformations are multiplying, while the one for the rotation, shouldn't */}
          <ModelInstance index={0} rotate={rotation} scale={scale} multiplyWithCurrentTransform={false} />
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
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
})
