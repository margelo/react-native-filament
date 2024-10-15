import { useSharedValue } from 'react-native-worklets-core'
import { CameraManipulator, Float3 } from '../types'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { RenderCallbackContext } from './RenderCallbackContext'
import { BoxedHybridObject } from 'react-native-nitro-modules/lib/BoxedHybridObject'

export type CameraProps = {
  /**
   * Lens's focal length in millimeters.focalLength > 0.
   */
  focalLengthInMillimeters?: number

  /**
   * The aspect ratio.
   * Uses the views aspect ratio by default.
   */
  aspect?: number

  /**
   * Distance in world units from the camera to the near plane. near > 0.
   */
  near?: number

  /**
   * Distance in world units from the camera to the far plane. far > near.
   */
  far?: number

  // TODO: make the camera parameters (or all) possibly ISharedValues to allow for automatic animations
  /**
   * "eye" The position of the camera in space
   */
  cameraPosition?: Float3

  /**
   * The target position to look at
   */
  cameraTarget?: Float3

  /**
   * The up vector of the camera (Usually `[0, 1, 0]`)
   */
  cameraUp?: Float3

  /**
   * The camera can optionally be owned by a {@linkcode CameraManipulator}.
   * In this case the manipulators state will be used to update the camera.
   */
  cameraManipulator?: BoxedHybridObject<CameraManipulator>
}

// Sensible defaults:
const defaultCameraPosition: Float3 = [0, 0, 8]
const defaultCameraTarget: Float3 = [0, 0, 0]
const defaultCameraUp: Float3 = [0, 1, 0]
const defaultFocalLengthInMillimeters = 28
const defaultNear = 0.1
const defaultFar = 100

export function Camera({ cameraManipulator, ...cameraConfig }: CameraProps) {
  const { camera, view } = useFilamentContext()

  const {
    aspect,
    cameraUp = defaultCameraUp,
    cameraTarget = defaultCameraTarget,
    cameraPosition = defaultCameraPosition,
    near = defaultNear,
    far = defaultFar,
    focalLengthInMillimeters = defaultFocalLengthInMillimeters,
  } = cameraConfig

  const cameraPositionX = cameraPosition[0]
  const cameraPositionY = cameraPosition[1]
  const cameraPositionZ = cameraPosition[2]
  const cameraTargetX = cameraTarget[0]
  const cameraTargetY = cameraTarget[1]
  const cameraTargetZ = cameraTarget[2]
  const cameraUpX = cameraUp[0]
  const cameraUpY = cameraUp[1]
  const cameraUpZ = cameraUp[2]

  const prevAspectRatio = useSharedValue(0)
  RenderCallbackContext.useRenderCallback(() => {
    'worklet'

    const unboxedCamera = camera.unbox()
    const aspectRatio = view.unbox().getAspectRatio()
    if (prevAspectRatio.value !== aspectRatio) {
      prevAspectRatio.value = aspectRatio
      // Setup camera lens:
      unboxedCamera.setLensProjection(focalLengthInMillimeters, aspect ?? aspectRatio, near, far)
      console.log('Setting up camera lens with aspect ratio:', aspectRatio)
    }

    if (cameraManipulator != null) {
      const unboxedCameraManipulator = cameraManipulator.unbox()
      unboxedCamera.lookAtCameraManipulator(unboxedCameraManipulator)
    } else {
      unboxedCamera.lookAt(
        [cameraPositionX, cameraPositionY, cameraPositionZ],
        [cameraTargetX, cameraTargetY, cameraTargetZ],
        [cameraUpX, cameraUpY, cameraUpZ]
      )
    }
  }, [
    prevAspectRatio,
    camera,
    view,
    focalLengthInMillimeters,
    aspect,
    near,
    far,
    cameraManipulator,
    cameraPositionX,
    cameraPositionY,
    cameraPositionZ,
    cameraTargetX,
    cameraTargetY,
    cameraTargetZ,
    cameraUpX,
    cameraUpY,
    cameraUpZ,
  ])

  return null
}
