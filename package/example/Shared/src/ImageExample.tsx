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
  resizeMode?: 'contain' | 'cover' | 'scale'
}

export function Image({ source, resizeMode = 'contain' }: ImageProps) {
  const { engine, renderableManager, scene, view, transformManager } = useFilamentContext()

  // Create the material which will be used to render the image
  const imageMaterialBuffer = useBuffer({ source: ImageMaterial })
  const imageBuffer = useBuffer({ source: source })

  const material = useDisposableResource(
    useWorkletCallback(() => {
      'worklet'
      if (imageMaterialBuffer == null || imageBuffer == null) return undefined

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

      const xMajor = dstWidth / srcWidth > dstHeight / srcHeight
      if (resizeMode === 'scale') {
        sx = 1.0
        sy = 1.0
        tx = 0.0
        ty = 0.0
      } else if (resizeMode === 'contain') {
        if (xMajor) {
          sx = srcRatio / dstRatio
          sy = 1.0
          tx = ((1.0 - sx) * 0.5) / sx
          ty = 0.0
        } else {
          sx = 1.0
          sy = dstRatio / srcRatio
          tx = 0.0
          ty = ((1.0 - sy) * 0.5) / sy
        }
      } else if (resizeMode === 'cover') {
        /**
         * Scale the image uniformly (maintain the image’s aspect ratio) so that
         * both dimensions (width and height) of the image will be equal to or larger than
         * the corresponding dimension of the view (minus padding).
         */

        tx = 0.0
        ty = 0.0

        const widthScale = dstWidth / srcWidth
        const heightScale = dstHeight / srcHeight
        const scale = Math.max(widthScale, heightScale)

        const scaledWidth = srcWidth * scale
        const scaledHeight = srcHeight * scale

        sx = scaledWidth / dstWidth
        sy = scaledHeight / dstHeight
      } else {
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
