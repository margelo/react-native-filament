import React from 'react'
import { StyleSheet } from 'react-native'
import { Camera, FilamentScene, FilamentView, Light, Model, Skybox } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')
const skybox = require('../../assets/default_env_skybox.ktx')

function Renderer() {
  return (
    <FilamentView style={styles.container}>
      <Camera />
      <Light type="directional" intensity={1_000_000} colorKelvin={6_500} />
      <Model source={drone} transformToUnitCube />
      <Skybox source={skybox} />
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
  container: { flex: 1 },
})
