import * as React from 'react'
import { StyleSheet } from 'react-native'
import {
  FilamentScene,
  FilamentView,
  Camera,
  Skybox,
  DefaultLight,
  RenderCallback,
  Model,
  ModelInstance,
  Float3,
} from 'react-native-filament'
import DroneGlb from '@assets/buster_drone.glb'
import { useCallback } from 'react'
import { useSharedValue } from 'react-native-worklets-core'

function Renderer() {
  const rotation = useSharedValue<Float3>([0, 0, 0])

  const renderCallback: RenderCallback = useCallback(() => {
    'worklet'

    rotation.value[1] += 0.01
    if (rotation.value[1] >= Math.PI * 2) {
      // reset / don't overflow
      rotation.value[1] = 0
    }

    // need to make a new object ref so that the listener fires
    rotation.value = [rotation.value[0], rotation.value[1], rotation.value[2]]
  }, [rotation])

  return (
    <FilamentView style={styles.filamentView} enableTransparentRendering={false} renderCallback={renderCallback}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />

      <Model source={DroneGlb} transformToUnitCube scale={[3, 3, 3]}>
        {/* Note: we apply the rotation individually as the above transformations are multiplying, while the one for the rotation, shouldn't */}
        <ModelInstance index={0} rotate={rotation} multiplyWithCurrentTransform={false} />
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
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
})
