import * as React from 'react'

import { StyleSheet } from 'react-native'
import { FilamentView, Camera, FilamentScene, Model, Light, Skybox } from 'react-native-filament'

function Renderer() {
  return (
    <FilamentView style={styles.container}>
      <Camera />
      <Light type="directional" intensity={10_00000} colorKelvin={6_500} />
      <Model source={require('@assets/buster_drone.glb')} transformToUnitCube />

      <Skybox source={require('@assets/default_env_ibl.ktx')} />
    </FilamentView>
  )
}

export function SkyboxExample() {
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
})
