import * as React from 'react'
import { useCallback } from 'react'

import { StyleSheet } from 'react-native'
import {
  FilamentView,
  useWorld,
  useRigidBody,
  useStaticPlaneShape,
  useWorkletCallback,
  useFilamentContext,
  RenderCallback,
  FilamentScene,
  DefaultLight,
  Camera,
} from 'react-native-filament'
import { useCoin } from './useCoin'
import { useSharedValue } from 'react-native-worklets-core'

function PhysicsCoinRenderer() {
  const world = useWorld(0, -9, 0)

  const { transformManager } = useFilamentContext()

  // Create an invisible floor:
  const floorShape = useStaticPlaneShape(0, 1, 0, 0)
  useRigidBody({
    mass: 0,
    origin: [0, -1.5, 0],
    friction: 100,
    shape: floorShape,
    world,
    id: 'floor',
  })

  const hasNotifiedTouchedFloor = useSharedValue(false)
  const [coinABody, coinAEntity] = useCoin(
    world,
    [0, 3, 0.0],
    useWorkletCallback((_thisBody, collidedWith) => {
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
    })
  )
  const [coinBBody, coinBEntity] = useCoin(world, [0, 3, 0.5])
  const [coinCBody, coinCEntity] = useCoin(world, [0, 3, 1.0])
  const [coinDBody, coinDEntity] = useCoin(world, [0, 3, 1.5])

  const renderCallback: RenderCallback = useCallback(
    ({ passedSeconds }) => {
      'worklet'

      // Wait until the screen is mounted
      if (passedSeconds <= 1) {
        return
      }

      // Update physics:
      world.stepSimulation(1 / 60, 1, 1 / 60)
      if (coinAEntity != null) {
        transformManager.updateTransformByRigidBody(coinAEntity, coinABody)
      }
      if (coinBEntity != null) {
        transformManager.updateTransformByRigidBody(coinBEntity, coinBBody)
      }
      if (coinCEntity != null) {
        transformManager.updateTransformByRigidBody(coinCEntity, coinCBody)
      }
      if (coinDEntity != null) {
        transformManager.updateTransformByRigidBody(coinDEntity, coinDBody)
      }
    },
    [coinABody, coinAEntity, coinBBody, coinBEntity, coinCBody, coinCEntity, coinDBody, coinDEntity, transformManager, world]
  )

  return (
    <FilamentView style={styles.filamentView} renderCallback={renderCallback}>
      <DefaultLight />
      <Camera />
    </FilamentView>
  )
}

export function PhysicsCoin() {
  return (
    <FilamentScene>
      <PhysicsCoinRenderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
