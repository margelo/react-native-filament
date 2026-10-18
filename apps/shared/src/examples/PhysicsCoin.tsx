import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { scheduleOnRN } from 'react-native-worklets'
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  quaternionFromAxisAngle,
  useCylinderShape,
  useFilamentContext,
  useModel,
  useRenderThreadEffect,
  useRigidBody,
  useStaticPlaneShape,
  useWorld,
  type CollisionShape,
  type Float3,
  type Model,
  type PhysicsWorld,
} from 'react-native-filament'

const coin = require('../../assets/coin.glb')
const COIN_SCALE = 0.5
const DROPS: Float3[] = [
  [0, 3, 0],
  [0, 3, 0.5],
  [0, 3, 1],
  [0, 3, 1.5],
]

function Coin({ world, model, index, shape }: { world: PhysicsWorld; model: Model; index: number; shape: CollisionShape | undefined }) {
  const { transformManager } = useFilamentContext()
  const rootEntity = useMemo(() => model.getInstance(index).rootEntity, [model, index])
  const rotation = useMemo(() => quaternionFromAxisAngle([Math.random(), Math.random(), Math.random()], Math.random() * Math.PI * 2), [])
  useRenderThreadEffect(() => {
    'worklet'
    transformManager.setScale(rootEntity, [COIN_SCALE, COIN_SCALE, COIN_SCALE])
  }, [transformManager, rootEntity])
  useRigidBody(
    world,
    shape == null
      ? undefined
      : { shape, mass: 1, position: DROPS[index], rotation, friction: 1, angularDamping: 0.5, id: index === 0 ? 'coin-a' : `coin-${index}`, entity: rootEntity }
  )
  return null
}

function Coins({ world, model }: { world: PhysicsWorld; model: Model }) {
  const [x, y, z] = model.boundingBox.halfExtent
  const shape = useCylinderShape(world, [x * COIN_SCALE, y * COIN_SCALE, z * COIN_SCALE], 'y')
  return (
    <>
      {DROPS.map((_, index) => (
        <Coin key={index} world={world} model={model} index={index} shape={shape} />
      ))}
    </>
  )
}

function PhysicsCoinRenderer({ onLanded }: { onLanded: (message: string) => void }) {
  const world = useWorld({ gravity: [0, -9, 0] })
  const model = useModel(coin, { instanceCount: DROPS.length })
  const floorShape = useStaticPlaneShape(world, [0, 1, 0], -1.5)
  useRigidBody(world, floorShape == null ? undefined : { shape: floorShape, mass: 0, friction: 1, id: 'floor' })

  useRenderThreadEffect(() => {
    'worklet'
    if (world == null) return
    const subscription = world.addOnCollisionListener((events) => {
      const landed = events.some((event) => {
        const ids = [event.bodyA.id, event.bodyB.id]
        return event.kind === 'began' && ids.includes('coin-a') && ids.includes('floor')
      })
      if (landed) scheduleOnRN(onLanded, 'Coin A touched the floor!')
      return !landed
    })
    return () => subscription.remove()
  }, [world, onLanded])

  return (
    <FilamentView style={styles.filamentView} transparent>
      <DefaultLight />
      <Camera />
      {world != null && model.state === 'loaded' && <Coins world={world} model={model.model} />}
    </FilamentView>
  )
}

export function PhysicsCoin() {
  const [status, setStatus] = useState('Coins are falling…')
  return (
    <View style={styles.container}>
      <FilamentScene>
        <PhysicsCoinRenderer onLanded={setStatus} />
      </FilamentScene>
      <Text style={styles.status}>{status}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filamentView: { flex: 1, backgroundColor: 'lightblue' },
  status: { padding: 8, textAlign: 'center' },
})
