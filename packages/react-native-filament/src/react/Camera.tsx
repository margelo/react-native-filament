import { useContext, useEffect } from 'react'
import { PixelRatio } from 'react-native'
import { bindSharedValue } from '../bindings/bindSharedValue'
import { isListenableValue } from '../bindings/isListenableValue'
import type { ListenableValue } from '../bindings/ListenableValue'
import { useTransformBinding } from '../hooks/useTransformBinding'
import { lookAtRotation } from '../math/lookAtRotation'
import type { CameraManipulator } from '../specs/control/CameraManipulator.nitro'
import type { Float3 } from '../specs/types/Float3'
import { FilamentViewContext } from './FilamentViewContext'
import { useFilamentScene } from './useFilamentScene'
import { useRenderCommit } from './useRenderCommit'
import { useReportFailure } from './useReportFailure'
import type { Camera as NativeCamera } from '../specs/scene/Camera.nitro'

export interface CameraProps {
  /** Focal length of the lens in millimeters. @default 28 */
  focalLengthInMillimeters?: number
  /**
   * Width divided by height, for example of a `useRecorder` video. @default the aspect ratio of the
   * closest `FilamentView`
   */
  aspect?: number
  /** Distance to the near plane in meters. @default 0.1 */
  near?: number
  /** Distance to the far plane in meters. @default 100 */
  far?: number
  /** Where the camera is. @default [0, 0, 8] */
  cameraPosition?: Float3 | ListenableValue<Float3>
  /** The point the camera looks at. @default [0, 0, 0] */
  cameraTarget?: Float3 | ListenableValue<Float3>
  /** @default [0, 1, 0] */
  cameraUp?: Float3 | ListenableValue<Float3>
  /**
   * Takes the camera's pose from the manipulator instead of the pose props, and sizes the
   * manipulator's viewport to the closest `FilamentView` in points.
   */
  cameraManipulator?: CameraManipulator
}

const defaultPosition: Float3 = [0, 0, 8]
const defaultTarget: Float3 = [0, 0, 0]
const defaultUp: Float3 = [0, 1, 0]

function read(value: Float3 | ListenableValue<Float3>): Float3 {
  'worklet'
  return isListenableValue(value) ? value.value : value
}

function keyOf(value: Float3 | ListenableValue<Float3>): Float3 | ListenableValue<Float3> | string {
  return isListenableValue(value) ? value : value.join()
}

/** Configures the camera of the closest `FilamentScene`. */
export function Camera({
  focalLengthInMillimeters = 28,
  aspect,
  near = 0.1,
  far = 100,
  cameraPosition = defaultPosition,
  cameraTarget = defaultTarget,
  cameraUp = defaultUp,
  cameraManipulator,
}: CameraProps) {
  const { camera } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const target = useContext(FilamentViewContext)?.target

  useEffect(() => {
    if (aspect == null) return
    commit
      .run(() => {
        'worklet'
        camera.setLensProjection(focalLengthInMillimeters, aspect, near, far)
      })
      .catch(fail)
  }, [camera, commit, fail, focalLengthInMillimeters, aspect, near, far])

  useEffect(() => {
    if (target == null) return
    const subscription = target.addOnResizeListener((width, height) => {
      const pixelRatio = PixelRatio.get()
      cameraManipulator?.setViewport(width / pixelRatio, height / pixelRatio)
      if (aspect != null) return
      commit
        .run(() => {
          'worklet'
          camera.setLensProjection(focalLengthInMillimeters, width / height, near, far)
        })
        .catch(fail)
    })
    return () => subscription.remove()
  }, [target, camera, commit, fail, cameraManipulator, focalLengthInMillimeters, aspect, near, far])

  useEffect(() => {
    if (cameraManipulator == null) return
    commit
      .run(() => {
        'worklet'
        camera.followManipulator(cameraManipulator)
      })
      .catch(fail)
    return () => {
      commit.post(() => {
        'worklet'
        camera.followManipulator(undefined)
      })
    }
  }, [camera, commit, fail, cameraManipulator])

  const poseKeys = [keyOf(cameraPosition), keyOf(cameraTarget), keyOf(cameraUp)]
  const followsManipulator = cameraManipulator != null
  useEffect(() => {
    if (followsManipulator) return
    const eye = read(cameraPosition)
    const center = read(cameraTarget)
    const up = read(cameraUp)
    commit
      .run(() => {
        'worklet'
        camera.lookAt(eye, center, up)
      })
      .catch(fail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, commit, fail, followsManipulator, ...poseKeys])

  const animated = [cameraPosition, cameraTarget, cameraUp].filter(isListenableValue)
  const binding = useTransformBinding(animated.length > 0 && !followsManipulator ? camera.entity : undefined)
  useEffect(() => {
    if (binding == null) return
    const pose = { position: cameraPosition, target: cameraTarget, up: cameraUp }
    const apply = () => {
      'worklet'
      const eye = read(pose.position)
      const [x, y, z, w] = lookAtRotation(eye, read(pose.target), read(pose.up))
      binding.setTranslation(eye[0], eye[1], eye[2])
      binding.setRotation(x, y, z, w)
    }
    const removers = [cameraPosition, cameraTarget, cameraUp].filter(isListenableValue).map((value) => bindSharedValue(value, apply))
    return () => removers.forEach((remove) => remove())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, ...poseKeys])

  return null
}

/** The native camera of a scene, configured by the `Camera` component. */
export type Camera = NativeCamera
