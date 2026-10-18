import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { Animator, Camera, DebugBox, DefaultLight, FilamentScene, FilamentView, Model, Skybox, type AnimationItem } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')

function Renderer() {
  const onAnimationsLoaded = useCallback((items: AnimationItem[]) => {
    console.log('Animations loaded:', items)
  }, [])
  return (
    <FilamentView style={styles.container}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />
      <Model source={drone} transformToUnitCube scale={[2, 2, 2]}>
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
  container: { flex: 1 },
})
