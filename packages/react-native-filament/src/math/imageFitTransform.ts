import type { Mat3 } from '../specs/types/Mat3'

/** How an image fills a view: `contain` letterboxes, `cover` crops, `scale` stretches. */
export type ImageResizeMode = 'contain' | 'cover' | 'scale'

/**
 * The UV transform that fits an image of `imageWidth` × `imageHeight` into a view of `width` × `height`,
 * for an image background material's `transform` parameter. Runs in any runtime.
 */
export function imageFitTransform(
  imageWidth: number,
  imageHeight: number,
  width: number,
  height: number,
  resizeMode: ImageResizeMode
): Mat3 {
  'worklet'
  if (resizeMode === 'scale') return [1, 0, 0, 0, 1, 0, 0, 0, 1]
  const viewAspect = width / height
  const imageAspect = imageWidth / imageHeight
  const viewIsWider = viewAspect > imageAspect
  const adjustsWidth = resizeMode === 'cover' ? !viewIsWider : viewIsWider
  const scaleX = adjustsWidth ? viewAspect / imageAspect : 1
  const scaleY = adjustsWidth ? 1 : imageAspect / viewAspect
  return [scaleX, 0, 0, 0, scaleY, 0, (1 - scaleX) / 2, (1 - scaleY) / 2, 1]
}
