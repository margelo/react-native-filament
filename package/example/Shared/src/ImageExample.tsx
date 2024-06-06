import React from 'react'
import { StyleSheet } from 'react-native'
import { BackgroundImage, Camera, Filament, Model } from 'react-native-filament'
import { DefaultLight } from './components/DefaultLight'
import BackgroundImageMaterial from '~/assets/background_image.matc'

const imageResource = require('~/assets/example_background.jpeg')

function Renderer() {
  return (
    <>
      <Camera />
      <DefaultLight />
      <Model source={require('~/assets/pengu.glb')} transformToUnitCube />

      <BackgroundImage source={imageResource} materialSource={BackgroundImageMaterial} resizeMode="cover" />
    </>
  )
}

export function ImageExample() {
  return (
    <Filament style={styles.container}>
      <Renderer />
    </Filament>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
