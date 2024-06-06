import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import {
  BufferSource,
  Camera,
  Filament,
  Mat3f,
  Model,
  useBuffer,
  useDisposableResource,
  useEntityInScene,
  useFilamentContext,
  useWorkletCallback,
  useWorkletMemo,
} from 'react-native-filament'
import { DefaultLight } from './components/DefaultLight'
import ImageMaterial from '~/assets/image.matc'

type ImageProps = {
  source: BufferSource
  resizeMode?: 'contain' | 'cover'
}

export function Image({ source, resizeMode = 'contain' }: ImageProps) {
  const { engine, renderableManager, scene, view, transformManager } = useFilamentContext()

  // Create the material which will be used to render the image
  const imageMaterialBuffer = useBuffer({ source: ImageMaterial })
  const imageBuffer = useBuffer({ source: source })
  console.log({
    imageMaterialBuffer,
    imageBuffer,
  })
  const material = useDisposableResource(
    useWorkletCallback(() => {
      'worklet'
      console.log('herst bist deppert?')
      if (imageMaterialBuffer == null || imageBuffer == null) return undefined
      console.log('debug 2')

      const newMaterial = engine.createMaterial(imageMaterialBuffer)
      const textureInfo = newMaterial.setDefaultTextureParameter(renderableManager, 'image', imageBuffer, 'sRGB')
      newMaterial.setDefaultIntParameter('showImage', 1)

      // Transform calculation
      const srcWidth = textureInfo.width
      const srcHeight = textureInfo.height
      const viewport = view.getViewport()
      const dstWidth = viewport.width
      const dstHeight = viewport.height

      const srcRatio = srcWidth / srcHeight
      const dstRatio = dstWidth / dstHeight

      let sx: number
      let sy: number
      let tx: number
      let ty: number

      if (resizeMode === 'contain') {
        if (dstRatio > srcRatio) {
          // Viewport is wider than the image's aspect ratio
          sx = sy = srcHeight / dstHeight
          tx = (dstWidth - srcWidth * sy) / (2 * dstWidth)
          ty = 0
        } else {
          // Viewport is narrower than the image's aspect ratio
          sx = sy = srcWidth / dstWidth
          tx = 0
          ty = (dstHeight - srcHeight * sx) / (2 * dstHeight)
        }
      } else if (resizeMode === 'cover') {
        if (dstRatio > srcRatio) {
          // Viewport is wider than the image's aspect ratio
          sx = sy = dstWidth / srcWidth
          tx = 0
          ty = (dstHeight - srcHeight * sx) / (2 * dstHeight)
        } else {
          // Viewport is taller than the image's aspect ratio
          sx = sy = dstHeight / srcHeight
          tx = (dstWidth - srcWidth * sy) / (2 * dstWidth)
          ty = 0
        }
      } else {
        console.log(`Invalid resizeMode: ${resizeMode}`)
        throw new Error(`Invalid resizeMode: ${resizeMode}`)
      }

      // eslint-disable-next-line prettier/prettier
        const transform: Mat3f = [
          1.0 / sx,   0.0,        0.0,
          0.0,        1.0 / sy,   0.0,
          -tx,         -ty,        1.0
        ];
      console.log({
        sx,
        sy,
        tx,
        ty,
      })

      newMaterial.setDefaultMat3fParameter('transform', transform)
      newMaterial.setDefaultFloat3Parameter('backgroundColor', [0.0, 0.0, 0.0])

      return newMaterial
    }),
    [engine, imageMaterialBuffer, imageBuffer]
  )

  // Create the geometric shape (a plane)
  const entity = useWorkletMemo(() => {
    'worklet'

    if (material == null) return

    return renderableManager.createImageBackgroundShape(material)
  }, [material, renderableManager])
  useEntityInScene(scene, entity)

  useEffect(() => {
    if (entity == null) return
    transformManager.setEntityPosition(entity, [0, -1.2, 0], false)
  }, [entity, transformManager])

  return null
}

const imageResource = require('~/assets/example_background.jpeg')
function Renderer() {
  return (
    <>
      <Camera />
      <DefaultLight />
      <Model source={require('~/assets/pengu.glb')} transformToUnitCube />

      <Image source={imageResource} resizeMode="cover" />
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
