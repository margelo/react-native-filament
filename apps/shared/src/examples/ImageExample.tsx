import React from 'react'
import { StyleSheet } from 'react-native'
import { BackgroundImage, Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

const backgroundMaterial = require('../../assets/background_image.filamat')
const image = require('../../assets/background.jpg')
const drone = require('../../assets/buster_drone.glb')

function Renderer() {
  return (
    <FilamentView style={styles.container}>
      <Camera />
      <DefaultLight />
      <Model source={drone} transformToUnitCube />
      <BackgroundImage source={image} materialSource={backgroundMaterial} resizeMode="cover" />
    </FilamentView>
  )
}

export function ImageExample() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
