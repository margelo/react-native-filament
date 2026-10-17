import type { HybridObject } from 'react-native-nitro-modules'
import type { CameraManipulator } from '../control/CameraManipulator.nitro'
import type { Entity } from '../types/Entity'
import type { Float3 } from '../types/Float3'

export interface Camera extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly entity: Entity
  /** @thread render */
  lookAt(eye: Float3, center: Float3, up: Float3): void
  /**
   * Perspective projection from a lens focal length in millimeters.
   * @thread render
   */
  setLensProjection(focalLengthMm: number, aspect: number, near: number, far: number): void
  /**
   * Perspective projection from a vertical field of view in degrees.
   * @thread render
   */
  setProjection(fovDegrees: number, aspect: number, near: number, far: number): void
  /** @thread render */
  setOrthographicProjection(left: number, right: number, bottom: number, top: number, near: number, far: number): void
  /**
   * Physically based exposure: aperture in f-stops, shutter speed in seconds, sensitivity in ISO.
   * @thread render
   */
  setExposure(aperture: number, shutterSpeedSeconds: number, sensitivityIso: number): void
  /**
   * Takes the pose of `manipulator` now and after every change it applies, or stops following for
   * `undefined`. Setting a pose directly with `lookAt` lasts until the manipulator moves.
   * @thread render
   */
  followManipulator(manipulator: CameraManipulator | undefined): void
}
