import { useMemo } from 'react'
import { TransformationProps } from '../../react/TransformContext'

/**
 * The transform props are objects / arrays. This method helps with merging two transformation props,
 * and making sure we maintain a stable reference. This means while the array reference of a prop might have changed,
 * the resulting merged object will have the same reference if the values are the same.
 */
export function useMergeTransformationProps(a?: TransformationProps, b?: TransformationProps) {
  const rotateAngle = a?.rotate?.angleInRadians ?? b?.rotate?.angleInRadians
  const rotateAxisX = a?.rotate?.axis[0] ?? b?.rotate?.axis[0]
  const rotateAxisY = a?.rotate?.axis[1] ?? b?.rotate?.axis[1]
  const rotateAxisZ = a?.rotate?.axis[2] ?? b?.rotate?.axis[2]

  const positonX = a?.position?.[0] ?? b?.position?.[0]
  const positonY = a?.position?.[1] ?? b?.position?.[1]
  const positonZ = a?.position?.[2] ?? b?.position?.[2]

  const scaleX = a?.scale?.[0] ?? b?.scale?.[0]
  const scaleY = a?.scale?.[1] ?? b?.scale?.[1]
  const scaleZ = a?.scale?.[2] ?? b?.scale?.[2]

  const mergedTransformProps = useMemo((): TransformationProps => {
    return {
      position: positonX != null && positonY != null && positonZ != null ? [positonX, positonY, positonZ] : undefined,
      scale: scaleX != null && scaleY != null && scaleZ != null ? [scaleX, scaleY, scaleZ] : undefined,
      rotate:
        rotateAngle != null && rotateAxisX != null && rotateAxisY != null && rotateAxisZ != null
          ? {
              angleInRadians: rotateAngle,
              axis: [rotateAxisX, rotateAxisY, rotateAxisZ],
            }
          : undefined,
      multiplyWithCurrentTransform: a?.multiplyWithCurrentTransform ?? b?.multiplyWithCurrentTransform,
      transformToUnitCube: a?.transformToUnitCube ?? b?.transformToUnitCube,
    }
  }, [
    positonX,
    positonY,
    positonZ,
    rotateAngle,
    rotateAxisX,
    rotateAxisY,
    rotateAxisZ,
    scaleX,
    scaleY,
    scaleZ,
    a?.multiplyWithCurrentTransform,
    a?.transformToUnitCube,
    b?.multiplyWithCurrentTransform,
    b?.transformToUnitCube,
  ])

  return mergedTransformProps
}
