import type { Mat3, Texture } from 'react-native-filament'

export type ImageFit = 'cover' | 'contain'

/** The UV transform of `background_image.filamat` that fits `image` into a view of `width` × `height`. */
export function imageFitTransform(image: Texture, width: number, height: number, fit: ImageFit): Mat3 {
  'worklet'
  const viewAspect = width / height
  const imageAspect = image.width / image.height
  const viewIsWider = viewAspect > imageAspect
  const adjustsWidth = fit === 'cover' ? !viewIsWider : viewIsWider
  const scaleX = adjustsWidth ? viewAspect / imageAspect : 1
  const scaleY = adjustsWidth ? 1 : imageAspect / viewAspect
  return [scaleX, 0, 0, 0, scaleY, 0, (1 - scaleX) / 2, (1 - scaleY) / 2, 1]
}
