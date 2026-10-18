import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, Text, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { scheduleOnRN } from 'react-native-worklets'
import {
  composeTransform,
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  quaternionFromAxisAngle,
  runOnRenderThread,
  type Engine,
  type Float3,
  type FilamentView,
  type PhysicsWorld,
  type Quaternion,
  type RigidBody,
} from 'react-native-filament'

const coin = Image.resolveAssetSource(require('../../assets/coin.glb'))
const shadowMaterial = Image.resolveAssetSource(require('../../assets/transparent_shadow_material.filamat'))

const COIN_SCALE = 0.5
const FLOOR_HEIGHT = -1.5
const DROPS: Float3[] = [
  [0, 3, 0],
  [0, 3, 0.5],
  [0, 3, 1],
  [0, 3, 1.5],
]

interface Simulation {
  engine: Engine
  world: PhysicsWorld
  coins: RigidBody[]
}

function randomRotation(): Quaternion {
  'worklet'
  return quaternionFromAxisAngle([Math.random(), Math.random(), Math.random()], Math.random() * Math.PI * 2)
}

function watchFirstCoin(world: PhysicsWorld, onLanded: (message: string) => void): void {
  'worklet'
  world.addOnCollisionListener((events) => {
    const landed = events.some((event) => {
      const ids = [event.bodyA.id, event.bodyB.id]
      return event.kind === 'began' && ids.includes('coin-a') && ids.includes('floor')
    })
    if (landed) scheduleOnRN(onLanded, 'Coin A touched the floor!')
    return !landed
  })
}

export function PhysicsCoinExample() {
  const [view, setView] = useState<FilamentView>()
  const [simulation, setSimulation] = useState<Simulation>()
  const [status, setStatus] = useState('Coins are falling…')

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment, shadow] = await Promise.all([
        engine.createViewTarget(view, { clearOptions: { color: [0.55, 0.8, 0.95, 1] } }),
        engine.loadModel({ uri: coin.uri }, { instanceCount: DROPS.length }),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
        engine.loadMaterial({ uri: shadowMaterial.uri }),
      ])
      const created = await runOnRenderThread(engine, () => {
        'worklet'
        target.view.shadowType = 'vsm'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.2, -1, -0.4], castShadows: true }).entity)
        scene.addModel(model)

        const shadowInstance = shadow.createInstance()
        shadowInstance.setFloatParameter('strength', 0.4)
        const ground = engine.createPlane({ width: 12, depth: 12 }, shadowInstance)
        engine.transformManager.setTranslation(ground.entity, [0, FLOOR_HEIGHT, 0])
        scene.addEntity(ground.entity)

        const world = engine.createPhysicsWorld({})
        world.createRigidBody({ shape: world.createStaticPlaneShape([0, 1, 0], FLOOR_HEIGHT), mass: 0, friction: 1, id: 'floor' })
        const [x, y, z] = model.boundingBox.halfExtent
        const coinShape = world.createCylinderShape([x * COIN_SCALE, y * COIN_SCALE, z * COIN_SCALE], 'y')
        const rm = engine.renderableManager
        const coins = DROPS.map((position, index) => {
          const instance = model.getInstance(index)
          for (const entity of instance.entities) {
            if (rm.hasComponent(entity)) rm.setCastShadows(entity, true)
          }
          engine.transformManager.setScale(instance.rootEntity, [COIN_SCALE, COIN_SCALE, COIN_SCALE])
          return world.createRigidBody({
            shape: coinShape,
            mass: 1,
            position,
            rotation: randomRotation(),
            friction: 0.8,
            id: index === 0 ? 'coin-a' : `coin-${index}`,
            entity: instance.rootEntity,
          })
        })
        watchFirstCoin(world, setStatus)

        const camera = engine.createCamera()
        camera.lookAt([0, 1, 8], [0, -0.5, 0.75], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(camera)
        return { world, coins, camera }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          created.camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      if (active) setSimulation({ engine, world: created.world, coins: created.coins })
      return { engine, resize }
    })
    return () => {
      active = false
      starting.then(({ engine, resize }) => {
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  const dropAgain = () => {
    if (simulation == null) return
    setStatus('Coins are falling…')
    const { engine, world, coins } = simulation
    runOnRenderThread(engine, () => {
      'worklet'
      coins.forEach((body, index) => {
        body.setTransform(composeTransform(DROPS[index]!, randomRotation()))
        body.linearVelocity = [0, 0, 0]
        body.angularVelocity = [0, 0, 0]
      })
      watchFirstCoin(world, setStatus)
    })
  }

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      <Text style={styles.status}>{status}</Text>
      <Button title="Drop again" disabled={simulation == null} onPress={dropAgain} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  status: { padding: 8, textAlign: 'center' },
})
