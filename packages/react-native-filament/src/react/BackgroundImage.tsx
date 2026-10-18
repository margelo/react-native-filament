import { useContext, useEffect } from 'react'
import type { AssetLike } from '../assets/AssetLike'
import { assetKey } from '../assets/assetKey'
import { toAssetSource } from '../assets/toAssetSource'
import { useDisposableResource } from '../hooks/useDisposableResource'
import { useEntityInScene } from '../hooks/useEntityInScene'
import { imageFitTransform, type ImageResizeMode } from '../math/imageFitTransform'
import type { MaterialInstance } from '../specs/materials/MaterialInstance.nitro'
import type { Renderable } from '../specs/scene/Renderable.nitro'
import { FilamentViewContext } from './FilamentViewContext'
import { useFilamentScene } from './useFilamentScene'
import { useRenderCommit } from './useRenderCommit'
import { useReportFailure } from './useReportFailure'

export interface BackgroundImageProps {
  /** A PNG, JPEG or KTX2 image. */
  source: AssetLike
  /**
   * A compiled image background material with an `image` sampler, an `int showImage`, a
   * `float3 backgroundColor` and a `mat3 transform` parameter, such as the examples'
   * `background_image.filamat`.
   */
  materialSource: AssetLike
  /** @default 'contain' */
  resizeMode?: ImageResizeMode
}

interface Background {
  instance: MaterialInstance
  renderable: Renderable
  imageWidth: number
  imageHeight: number
  dispose(): void
}

/** An image drawn behind the scene of the closest `FilamentScene`, fitted to the closest view. */
export function BackgroundImage({ source, materialSource, resizeMode = 'contain' }: BackgroundImageProps) {
  const { engine, scene } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const target = useContext(FilamentViewContext)?.target
  const imageKey = assetKey(source)
  const materialKey = assetKey(materialSource)

  const background = useDisposableResource<Background>(async () => {
    const [image, material] = await Promise.all([
      engine.loadTexture(toAssetSource(source), {}),
      engine.loadMaterial(toAssetSource(materialSource)),
    ])
    const { instance, renderable } = await commit.run(() => {
      'worklet'
      const created = material.createInstance()
      created.setTexture('image', image, {})
      created.setIntParameter('showImage', 1)
      created.setFloat3Parameter('backgroundColor', [0, 0, 0])
      return { instance: created, renderable: engine.createBackground(created) }
    })
    return {
      instance,
      renderable,
      imageWidth: image.width,
      imageHeight: image.height,
      dispose: () => {
        renderable.dispose()
        material.dispose()
        image.dispose()
      },
    }
  }, [engine, commit, imageKey, materialKey])
  useEntityInScene(scene, background?.renderable.entity)

  useEffect(() => {
    if (background == null || target == null) return
    const { instance, imageWidth, imageHeight } = background
    const subscription = target.addOnResizeListener((width, height) => {
      commit
        .run(() => {
          'worklet'
          instance.setMat3Parameter('transform', imageFitTransform(imageWidth, imageHeight, width, height, resizeMode))
        })
        .catch(fail)
    })
    return () => subscription.remove()
  }, [background, target, resizeMode, commit, fail])

  return null
}
