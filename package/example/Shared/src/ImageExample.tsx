import React from 'react'
import { StyleSheet } from 'react-native'
import {
  Camera,
  Filament,
  useBuffer,
  useDisposableResource,
  useEntityInScene,
  useFilamentContext,
  useWorkletCallback,
  useWorkletMemo,
} from 'react-native-filament'
import { DefaultLight } from './components/DefaultLight'
import ImageMaterial from '~/assets/image.matc'

const imageResource = require('~/assets/example_background.jpeg')

function Image() {
  const { engine, renderableManager, scene } = useFilamentContext()

  // Create the material which will be used to render the image
  const imageMaterialBuffer = useBuffer({ source: ImageMaterial })
  const imageBuffer = useBuffer({ source: imageResource })
  const material = useDisposableResource(
    useWorkletCallback(() => {
      'worklet'
      if (imageMaterialBuffer == null || imageBuffer == null) return undefined

      const mat = engine.createMaterial(imageMaterialBuffer)
      mat.setDefaultTextureParameter(renderableManager, 'image', imageBuffer, 'sRGB')
      mat.setDefaultIntParameter('showImage', 1)
      return mat
    }),
    [engine, imageMaterialBuffer, imageBuffer]
  )

  // Create the geometric shape (a plane)
  const entity = useWorkletMemo(() => {
    'worklet'

    if (material == null) return

    return renderableManager.createPlane(material, 3, 0.0001, 3)
  }, [])
  useEntityInScene(scene, entity)

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
