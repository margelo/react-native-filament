import { useFilamentContext } from '../react/FilamentContext'
import { Float3, OrbitCameraManipulatorConfig } from '../types'
import { useDisposableResource } from './useDisposableResource'

const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

export function useCameraManipulator({
  orbitHomePosition = cameraPosition,
  targetPosition = cameraTarget,
  upVector = cameraUp,
  ...config
}: OrbitCameraManipulatorConfig) {
  const { engine } = useFilamentContext()

  const orbitHomePositionX = orbitHomePosition[0]
  const orbitHomePositionY = orbitHomePosition[1]
  const orbitHomePositionZ = orbitHomePosition[2]
  const targetPositionX = targetPosition[0]
  const targetPositionY = targetPosition[1]
  const targetPositionZ = targetPosition[2]
  const upVectorX = upVector[0]
  const upVectorY = upVector[1]
  const upVectorZ = upVector[2]

  const cameraManipulator = useDisposableResource(
    () =>
      Promise.resolve(
        engine.createOrbitCameraManipulator({
          orbitHomePosition: [orbitHomePositionX, orbitHomePositionY, orbitHomePositionZ],
          targetPosition: [targetPositionX, targetPositionY, targetPositionZ],
          upVector: [upVectorX, upVectorY, upVectorZ],
          ...config,
        })
      ),
    [
      config,
      engine,
      orbitHomePositionX,
      orbitHomePositionY,
      orbitHomePositionZ,
      targetPositionX,
      targetPositionY,
      targetPositionZ,
      upVectorX,
      upVectorY,
      upVectorZ,
    ]
  )

  return cameraManipulator
}
