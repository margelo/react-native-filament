import * as React from 'react'
import { useCallback, useEffect, useRef } from 'react'

import { StyleSheet, View } from 'react-native'
import {
  Filament,
  useEngine,
  Float3,
  useRenderCallback,
  useAsset,
  useWorld,
  useRigidBody,
  useStaticPlaneShape,
  useView,
  useCamera,
  useScene,
} from 'react-native-filament'
import { getPath } from './getPath'
import { useCoin } from './useCoin'

const indirectLightPath = getPath('default_env_ibl.ktx')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export function PhysicsCoin() {
  const engine = useEngine()
  const world = useWorld(0, -9, 0)
  const view = useView(engine)
  const camera = useCamera(engine)
  const scene = useScene(engine)

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

  const hasNotifiedTouchedFloor = useRef(false)

  const [coinABody, coinAEntity] = useCoin(
    engine,
    world,
    [0, 3, 0.0],
    useCallback((_thisBody, collidedWith) => {
      if (hasNotifiedTouchedFloor.current) {
        return
      }

      if (collidedWith.id !== 'floor') {
        return
      }

      hasNotifiedTouchedFloor.current = true
      console.log('Coin touched the floor!')
    }, [])
  )

  // const [coinB, coinBEntity] = useCoin(engine, world, [-1.3, 3.5, -0.4])
  // const [coinC, coinCEntity] = useCoin(engine, world, [0.1, 3.5, 0.7])

  const light = useAsset({ path: indirectLightPath })
  useEffect(() => {
    if (light == null) return
    // create a default light
    engine.setIndirectLight(light)

    // Create a directional light for supporting shadows
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    scene.addEntity(directionalLight)
    return () => {
      // TODO: Remove directionalLight from scene
    }
  }, [engine, light, scene])

  const prevAspectRatio = useRef(0)
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
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
      // if (coinBEntity != null) {
      //   engine.updateTransformByRigidBody(coinBEntity, coinB)
      // }
      // if (coinCEntity != null) {
      //   engine.updateTransformByRigidBody(coinCEntity, coinC)
      // }
    }

    camera.lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
    </View>
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
