import { useFilamentScene } from '../react/useFilamentScene'
import type { CameraManipulator } from '../specs/control/CameraManipulator.nitro'
import type { OrbitManipulatorOptions } from '../specs/types/OrbitManipulatorOptions'
import { useDisposableResource } from './useDisposableResource'

/** An orbit manipulator for `Camera`'s `cameraManipulator` and `useOrbitGestures`, disposed on unmount. */
export function useCameraManipulator(options: OrbitManipulatorOptions = {}): CameraManipulator | undefined {
  const { engine } = useFilamentScene()
  const key = JSON.stringify(options)
  return useDisposableResource(() => engine.createOrbitManipulator(JSON.parse(key) as OrbitManipulatorOptions), [engine, key])
}
