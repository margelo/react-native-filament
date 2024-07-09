import * as React from 'react'
import { StyleSheet } from 'react-native'
import { FilamentContext, FilamentView, Camera, Skybox, Model, Animator, AnimationItem, DefaultLight } from 'react-native-filament'
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

      <Model source={DroneGlb}>
        <Animator onAnimationsLoaded={onAnimationsLoaded} />
      </Model>
    </FilamentView>
  )
}

export function NoneTransparent() {
  return (
    <FilamentContext>
      <Renderer />
    </FilamentContext>
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
