import React from 'react'
import { StyleSheet } from 'react-native'
import { BackgroundImage, Camera, DefaultLight, FilamentContext, FilamentView, Model } from 'react-native-filament'
import BackgroundImageMaterial from '~/assets/background_image.matc'

const imageResource = require('~/assets/background.jpg')

function Renderer() {
  return (
    <FilamentView style={styles.container}>
      <Camera />
      <DefaultLight />
      <Model source={require('~/assets/buster_drone.glb')} transformToUnitCube />

      <BackgroundImage source={imageResource} materialSource={BackgroundImageMaterial} resizeMode="cover" />
    </FilamentView>
  )
}

export function ImageExample() {
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
})
