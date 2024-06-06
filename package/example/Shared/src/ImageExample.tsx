import React from 'react'
import { StyleSheet } from 'react-native'
import { Camera, Filament, useBuffer } from 'react-native-filament'
import { DefaultLight } from './components/DefaultLight'
import ImageMaterial from '~/assets/image.matc'

function Image() {
  const imageMaterialBuffer = useBuffer({ source: ImageMaterial })

  return null
}

function Renderer() {
  return (
    <>
      <Camera />
      <DefaultLight />

      <Image />
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
