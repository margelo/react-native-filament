import * as React from 'react'
import { StyleSheet } from 'react-native'
import {
  FilamentScene,
  FilamentView,
  Camera,
  Skybox,
  Model,
  Animator,
  AnimationItem,
  DefaultLight,
  DebugBox,
} from 'react-native-filament'
import DroneGlb from '~/assets/buster_drone.glb'
import { useCallback } from 'react'

function Renderer() {
  const onAnimationsLoaded = useCallback((items: AnimationItem[]) => {
    console.log('Animations loaded:', items)
  }, [])

  return (
    <FilamentView style={styles.filamentView} enableTransparentRendering={false}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />

      <Model source={DroneGlb} transformToUnitCube scale={[2, 2, 2]}>
        <Animator onAnimationsLoaded={onAnimationsLoaded} />
        <DebugBox />
      </Model>
    </FilamentView>
  )
}

export function NoneTransparent() {
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
