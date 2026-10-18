import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { Filament, runOnRenderThread, type Engine } from 'react-native-filament'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

describe('Debug stats', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('counts live resources by kind until they are disposed', async () => {
    expect(engine.getDebugStats().liveResources).toEqual({})
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const created = await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      const light = engine.createDirectionalLight({})
      const world = engine.createPhysicsWorld({ autoStep: false })
      world.createRigidBody({ shape: world.createSphereShape(1), mass: 1 })
      return { scene, light, world }
    })
    expect(engine.getDebugStats().liveResources).toEqual({
      Model: 1,
      Scene: 1,
      Light: 1,
      PhysicsWorld: 1,
      CollisionShape: 1,
      RigidBody: 1,
    })
    model.dispose()
    await runOnRenderThread(engine, () => {
      'worklet'
      created.world.dispose()
      created.light.dispose()
    })
    await runOnRenderThread(engine, () => {
      'worklet'
    })
    expect(engine.getDebugStats().liveResources).toEqual({ Scene: 1 })
  })

  it('reports nothing after shutdown', async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      engine.createScene()
      engine.createCamera()
    })
    expect(Object.keys(engine.getDebugStats().liveResources).sort()).toEqual(['Camera', 'Scene'])
    await engine.shutdown()
    expect(engine.getDebugStats().liveResources).toEqual({})
  })
})
