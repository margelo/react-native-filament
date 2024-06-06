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

export function Image({ source }: ImageProps) {
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
        ];

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

      <Image source={imageResource} />
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
