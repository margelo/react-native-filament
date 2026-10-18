import React, { useMemo } from 'react'
import {
  ModelRenderer,
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
import { BenchmarkScene } from './BenchmarkScene'

const coin = require('../../assets/coin.glb')
export const BODY_COUNT = 200
const SCALE = 0.3
const FLOOR_HEIGHT = -1.5

/** Drop position of body `index`: a 10 × 10 grid in two layers. */
export function dropPosition(index: number): Float3 {
  const layer = Math.floor(index / 100)
  const cell = index % 100
  return [((cell % 10) - 4.5) * 0.45, 2 + layer * 1.5 + (cell % 7) * 0.2, (Math.floor(cell / 10) - 4.5) * 0.45]
}

function Coin({ world, model, index, shape }: { world: PhysicsWorld; model: Model; index: number; shape: CollisionShape | undefined }) {
  const { transformManager } = useFilamentContext()
  const entity = useMemo(() => model.getInstance(index).rootEntity, [model, index])
  useRenderThreadEffect(() => {
    'worklet'
    transformManager.setScale(entity, [SCALE, SCALE, SCALE])
  }, [transformManager, entity])
  const body = useRigidBody(
    world,
    shape == null ? undefined : { shape, mass: 1, position: dropPosition(index), friction: 0.8, id: `coin-${index}`, entity }
  )
  useRenderThreadEffect(() => {
    'worklet'
    if (body != null) body.activationState = 'never-sleep'
  }, [body])
  return null
}

function Coins({ world, model }: { world: PhysicsWorld; model: Model }) {
  const [x, y, z] = model.boundingBox.halfExtent
  const shape = useCylinderShape(world, [x * SCALE, y * SCALE, z * SCALE], 'y')
  return (
    <>
      {Array.from({ length: BODY_COUNT }, (_, index) => (
        <Coin key={index} world={world} model={model} index={index} shape={shape} />
      ))}
    </>
  )
}

function Physics() {
  const world = useWorld({ gravity: [0, -9.8, 0] })
  const model = useModel(coin, { instanceCount: BODY_COUNT })
  const floor = useStaticPlaneShape(world, [0, 1, 0], FLOOR_HEIGHT)
  useRigidBody(world, floor == null ? undefined : { shape: floor, mass: 0, friction: 1, id: 'floor' })
  return (
    <>
      <ModelRenderer model={model} />
      {world != null && model.state === 'loaded' && <Coins world={world} model={model.model} />}
    </>
  )
}

/** 200 coins that never sleep, resting on a floor after they fall: the solver and the entity sync run every frame. */
export function BenchPhysics() {
  return (
    <BenchmarkScene scene="physics-200" cameraPosition={[0, 3, 9]}>
      <Physics />
    </BenchmarkScene>
  )
}
