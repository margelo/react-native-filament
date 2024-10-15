import { useFilamentContext } from './useFilamentContext'
import { Float3, OrbitCameraManipulatorConfig } from '../types'
import { useDisposableResource } from './useDisposableResource'
import { NitroModules } from 'react-native-nitro-modules'

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
  const zoomSpeed = config.zoomSpeed?.[0]
  const orbitSpeedX = config.orbitSpeed?.[0]
  const orbitSpeedY = config.orbitSpeed?.[1]

  const cameraManipulator = useDisposableResource(() => {
    const localConfig: OrbitCameraManipulatorConfig = {
      orbitHomePosition: [orbitHomePositionX, orbitHomePositionY, orbitHomePositionZ],
      targetPosition: [targetPositionX, targetPositionY, targetPositionZ],
      upVector: [upVectorX, upVectorY, upVectorZ],
    }

    if (zoomSpeed != null) {
      localConfig.zoomSpeed = [zoomSpeed]
    }
    if (orbitSpeedX != null && orbitSpeedY != null) {
      localConfig.orbitSpeed = [orbitSpeedX, orbitSpeedY]
    }

    const unboxedEngine = engine.unbox()
    const newCameraManipulator = unboxedEngine.createOrbitCameraManipulator(localConfig)
    const boxedCameraManipulator = NitroModules.box(newCameraManipulator)
    return Promise.resolve(boxedCameraManipulator)
  }, [
    engine,
    orbitHomePositionX,
    orbitHomePositionY,
    orbitHomePositionZ,
    orbitSpeedX,
    orbitSpeedY,
    targetPositionX,
    targetPositionY,
    targetPositionZ,
    upVectorX,
    upVectorY,
    upVectorZ,
    zoomSpeed,
  ])

  return cameraManipulator
}
