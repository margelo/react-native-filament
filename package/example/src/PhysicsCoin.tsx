import * as React from 'react'
import { useRef } from 'react'

import { StyleSheet, View } from 'react-native'
import {
  Filament,
  Float3,
  useRenderCallback,
  useWorld,
  useRigidBody,
  useStaticPlaneShape,
  useWorkletCallback,
  FilamentProvider,
  useFilamentContext,
} from 'react-native-filament'
import { useCoin } from './useCoin'
import { useDefaultLight } from './hooks/useDefaultLight'
import { useSharedValue } from 'react-native-worklets-core'

// Camera config:
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

function PhysicsCoinRenderer() {
  useDefaultLight()
  const world = useWorld(0, -9, 0)

  const { engine, view, camera } = useFilamentContext()

  // Create an invisible floor:
  const floorShape = useStaticPlaneShape(0, 1, 0, 0)
  useRigidBody({
    mass: 0,
    origin: [0, -1.5, 0],
    friction: 10,
    shape: floorShape,
    world,
    id: 'floor',
  })

  const hasNotifiedTouchedFloor = useSharedValue(false)
  const [coinABody, coinAEntity] = useCoin(
    world,
    [0, 3, 0.0],
    useWorkletCallback(
      (_thisBody, collidedWith) => {
        'worklet'

        if (hasNotifiedTouchedFloor.value) {
          // TODO: This keeps getting called. Maybe we want to add a unsubscribe mechanism?
          return
        }

        if (collidedWith.id !== 'floor') {
          return
        }

        hasNotifiedTouchedFloor.value = true
        console.log('Coin touched the floor!')
      },
      [hasNotifiedTouchedFloor]
    )
  )

  const prevAspectRatio = useRef(0)
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
    'worklet'

    const aspectRatio = view.getAspectRatio()
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    // Update physics:
    if (passedSeconds > 3) {
      world.stepSimulation(1 / 60, 1, 1 / 60)
      if (coinAEntity != null) {
        engine.updateTransformByRigidBody(coinAEntity, coinABody)
      }
    }

    const cameraPosition: Float3 = [0, 0, 8]
    const cameraTarget: Float3 = [0, 0, 0]
    const cameraUp: Float3 = [0, 1, 0]
    camera.lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} />
    </View>
  )
}

export function PhysicsCoin() {
  return (
    <FilamentProvider>
      <PhysicsCoinRenderer />
    </FilamentProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
