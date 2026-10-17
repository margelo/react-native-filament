import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { makeMutable } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { bindSharedValue, Filament, quaternionFromAxisAngle, runOnRenderThread, type Engine, type Mat4 } from 'react-native-filament'
import { renderView } from './renderView'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

function expectClose(actual: number[], expected: number[]) {
  expect(actual.length).toBe(expected.length)
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index]!, 4))
}

describe('Transforms', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('round-trips local transforms and composes world transforms through parents', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const { local, world, parent } = await runOnRenderThread(engine, () => {
      'worklet'
      const tm = engine.transformManager
      const child = model.getInstance(0).rootEntity
      const translation: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]
      tm.setTransform(model.rootEntity, translation)
      tm.setTransform(child, [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1])
      return { local: tm.getTransform(child), world: tm.getWorldTransform(child), parent: tm.getParent(child) }
    })
    expect(parent).toBe(model.rootEntity)
    expectClose(local, [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1])
    expectClose(world, [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1])
  })

  it('replaces one component of a transform and keeps the others', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const transform = await runOnRenderThread(engine, () => {
      'worklet'
      const tm = engine.transformManager
      tm.setScale(model.rootEntity, [2, 2, 2])
      tm.setRotation(model.rootEntity, quaternionFromAxisAngle([0, 0, 1], Math.PI / 2))
      tm.setTranslation(model.rootEntity, [4, 5, 6])
      return tm.getTransform(model.rootEntity)
    })
    expectClose(transform, [0, 2, 0, 0, -2, 0, 0, 0, 0, 0, 2, 0, 4, 5, 6, 1])
  })

  it('fits a bounding box into the unit cube', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const transform = await runOnRenderThread(engine, () => {
      'worklet'
      engine.transformManager.transformToUnitCube(model.rootEntity, { center: [1, 2, 3], halfExtent: [4, 2, 1] })
      return engine.transformManager.getTransform(model.rootEntity)
    })
    expectClose(transform, [0.25, 0, 0, 0, 0, 0.25, 0, 0, 0, 0, 0.25, 0, -0.25, -0.5, -0.75, 1])
  })

  it('rejects entities without a transform and calls from other threads', async () => {
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      const light = engine.createDirectionalLight({})
      try {
        engine.transformManager.getTransform(light.entity)
        return 'read'
      } catch (error) {
        return error instanceof Error ? error.message : String(error)
      }
    })
    expect(message).toContain('FilamentInvalidEntityError')
    expect(() => engine.transformManager.getTransform(0)).toThrow('FilamentThreadError')
  })

  it('applies the latest binding values at the next frame start', async () => {
    const view = await renderView()
    const target = await engine.createViewTarget(view, {})
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const binding = await runOnRenderThread(engine, () => {
      'worklet'
      target.setScene(engine.createScene())
      return engine.createTransformBinding(model.rootEntity)
    })
    binding.setScale(3, 3, 3)
    binding.setTranslation(0, 1, 0)
    binding.setTranslation(7, 8, 9)
    const transform = await new Promise<Mat4>((resolve) => {
      runOnRenderThread(engine, () => {
        'worklet'
        const subscription = engine.addOnFrameListener(() => {
          subscription.remove()
          scheduleOnRN(resolve, engine.transformManager.getTransform(model.rootEntity))
          return false
        })
      })
    })
    expectClose(transform, [3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 7, 8, 9, 1])
    const shared = makeMutable(0)
    let unbind = () => {}
    const outcome = await new Promise<string>((resolve) => {
      unbind = bindSharedValue(shared, (value) => {
        'worklet'
        if (value !== 1) return
        try {
          binding.setTranslation(0, 0, 0)
          scheduleOnRN(resolve, 'ignored')
        } catch (error) {
          scheduleOnRN(resolve, error instanceof Error ? error.message : String(error))
        }
      })
      binding.dispose()
      shared.value = 1
    })
    unbind()
    expect(outcome).toBe('ignored')
  })

  it('stores value binding writes for render-thread reads', async () => {
    const binding = engine.createValueBinding(1)
    binding.set(42)
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      return binding.value
    })
    expect(read).toBe(42)
  })

  it('forwards shared value updates from the UI runtime', async () => {
    const binding = engine.createValueBinding(0)
    const shared = makeMutable(1)
    let unbind = () => {}
    const seen = await new Promise<number>((resolve) => {
      unbind = bindSharedValue(shared, (value) => {
        'worklet'
        binding.set(value)
        if (value === 5) scheduleOnRN(resolve, binding.value)
      })
      shared.value = 5
    })
    unbind()
    expect(seen).toBe(5)
    expect(binding.value).toBe(5)
  })
})
