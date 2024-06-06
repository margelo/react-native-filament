import React from 'react'
import { StyleSheet } from 'react-native'
import {
  Camera,
  Filament,
  Mat3f,
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
  const { engine, renderableManager, scene, view } = useFilamentContext()

  // Create the material which will be used to render the image
  const imageMaterialBuffer = useBuffer({ source: ImageMaterial })
  const imageBuffer = useBuffer({ source: imageResource })
  const material = useDisposableResource(
    useWorkletCallback(() => {
      'worklet'
      if (imageMaterialBuffer == null || imageBuffer == null) return undefined

      const mat = engine.createMaterial(imageMaterialBuffer)
      const textureInfo = mat.setDefaultTextureParameter(renderableManager, 'image', imageBuffer, 'sRGB')
      mat.setDefaultIntParameter('showImage', 1)

      // Transform calculation
      const srcWidth = textureInfo.width
      const srcHeight = textureInfo.height
      const viewport = view.getViewport()
      const dstWidth = viewport.width
      const dstHeight = viewport.height

      const srcRatio = srcWidth / srcHeight
      const dstRatio = dstWidth / dstHeight

      const xMajor = dstWidth / srcWidth > dstHeight / srcHeight

      let sx = 1.0
      let sy = dstRatio / srcRatio

      let tx = 0.0
      let ty = ((1.0 - sy) * 0.5) / sy

      if (xMajor) {
        sx = srcRatio / dstRatio
        sy = 1.0
        tx = ((1.0 - sx) * 0.5) / sx
        ty = 0.0
      }

      // eslint-disable-next-line prettier/prettier
      const transform: Mat3f = [
        1.0 / sx,   0.0,        0.0,
        0.0,        1.0 / sy,   0.0,
        -tx,        -ty,        1.0
      ]
      mat.setDefaultMat3fParameter('transform', transform)

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
