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
  CollisionCallback,
} from 'react-native-filament'
import { useCoin } from './useCoin'

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

  const [coinABody, coinAEntity] = useCoin(
    world,
    [0, 3, 0.0],
    useWorkletCallback<CollisionCallback>((coinRigidBody, collidedWith) => {
      'worklet'

      if (collidedWith.id !== 'floor') {
        return
      }

      console.log('Coin touched the floor!')
      coinRigidBody.setCollisionCallback(undefined);      
    })
  )
  const [coinBBody, coinBEntity] = useCoin(world, [0, 3, 0.5])
  const [coinCBody, coinCEntity] = useCoin(world, [0, 3, 1.0])
  const [coinDBody, coinDEntity] = useCoin(world, [0, 3, 1.5])

  const renderCallback: RenderCallback = useCallback(
    ({ passedSeconds, timeSinceLastFrame }) => {
      'worklet'

      // Wait until the screen is mounted
      if (passedSeconds <= 1) {
        return
      }

      if (coinAEntity == null || coinBEntity == null || coinCEntity == null) {
        return
      }
      // Update physics:
      world.stepSimulation(timeSinceLastFrame, 1, 1 / 60)
      transformManager.updateTransformByRigidBody(coinAEntity, coinABody)
      transformManager.updateTransformByRigidBody(coinBEntity, coinBBody)
      transformManager.updateTransformByRigidBody(coinCEntity, coinCBody)
      transformManager.updateTransformByRigidBody(coinDEntity, coinDBody)
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
