import * as React from 'react'
import { useCallback, useRef } from 'react'

import { StyleSheet, View } from 'react-native'
import {
  Filament,
  useEngine,
  Float3,
  useRenderCallback,
  useWorld,
  useRigidBody,
  useStaticPlaneShape,
  useView,
  useCamera,
  Engine,
} from 'react-native-filament'
import { useCoin } from './useCoin'
import { useDefaultLight } from './hooks/useDefaultLight'
import { useSharedValue } from 'react-native-worklets-core'

// Camera config:
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

type RendererProps = {
  engine: Engine
}
function PhysicsCoinRenderer({ engine }: RendererProps) {
  useDefaultLight(engine)
  const world = useWorld(0, -9, 0)
  const view = useView(engine)
  const camera = useCamera(engine)

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
    engine,
    world,
    [0, 3, 0.0],
    useCallback(
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

    const aspectRatio = view.aspectRatio
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
      <Filament style={styles.filamentView} engine={engine} />
    </View>
  )
}

export function PhysicsCoin() {
  const engine = useEngine()

  if (engine == null) return null
  return <PhysicsCoinRenderer engine={engine} />
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
