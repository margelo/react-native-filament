import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { Filament, runOnRenderThread, type Engine } from 'react-native-filament'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

function message(run: () => unknown): string {
  'worklet'
  try {
    run()
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('Light and renderable managers', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('creates every light type and reports it through the light manager', async () => {
    const types = await runOnRenderThread(engine, () => {
      'worklet'
      const lights = [
        engine.createDirectionalLight({}),
        engine.createSunLight({}),
        engine.createPointLight({}),
        engine.createSpotLight({}),
        engine.createFocusedSpotLight({}),
      ]
      return lights.map((light) => [light.type, engine.lightManager.getType(light.entity)])
    })
    expect(types).toEqual([
      ['directional', 'directional'],
      ['sun', 'sun'],
      ['point', 'point'],
      ['spot', 'spot'],
      ['focused-spot', 'focused-spot'],
    ])
  })

  it('round-trips light properties', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const lm = engine.lightManager
      const { entity } = engine.createSpotLight({ castShadows: false })
      lm.setIntensity(entity, 1234)
      lm.setColor(entity, [1, 0.5, 0.25])
      lm.setPosition(entity, [1, 2, 3])
      lm.setDirection(entity, [0, 0, -1])
      lm.setFalloff(entity, 7)
      lm.setSpotLightCone(entity, 0.2, 0.6)
      lm.setShadowCaster(entity, true)
      return {
        intensity: lm.getIntensity(entity),
        color: lm.getColor(entity),
        position: lm.getPosition(entity),
        direction: lm.getDirection(entity),
        falloff: lm.getFalloff(entity),
        cone: lm.getSpotLightCone(entity),
        shadows: lm.isShadowCaster(entity),
      }
    })
    expect(read.intensity).toBeGreaterThan(0)
    read.color.forEach((value, index) => expect(value).toBeCloseTo([1, 0.5, 0.25][index]!, 4))
    expect(read.position).toEqual([1, 2, 3])
    expect(read.direction).toEqual([0, 0, -1])
    expect(read.falloff).toBeCloseTo(7, 4)
    expect(read.cone[0]).toBeGreaterThan(0)
    expect(read.cone[1]).toBeGreaterThan(read.cone[0])
    expect(read.shadows).toBe(true)
  })

  it('reads and writes renderables of a loaded model', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const rm = engine.renderableManager
      const entity = model.entities[0]!
      rm.setCastShadows(entity, true)
      rm.setReceiveShadows(entity, false)
      rm.setAxisAlignedBoundingBox(entity, { center: [1, 2, 3], halfExtent: [1, 1, 2] })
      rm.scaleBoundingBox(entity, 2)
      rm.setPriority(entity, 7)
      rm.setCulling(entity, false)
      return {
        primitives: rm.getPrimitiveCount(entity),
        castsShadows: rm.isShadowCaster(entity),
        receivesShadows: rm.isShadowReceiver(entity),
        box: rm.getAxisAlignedBoundingBox(entity),
        badPriority: message(() => rm.setPriority(entity, 8)),
        notRenderable: message(() => rm.getPrimitiveCount(model.rootEntity)),
        notLight: message(() => engine.lightManager.getType(entity)),
      }
    })
    expect(read.primitives).toBeGreaterThan(0)
    expect(read.castsShadows).toBe(true)
    expect(read.receivesShadows).toBe(false)
    expect(read.box).toEqual({ center: [1, 2, 3], halfExtent: [2, 2, 4] })
    expect(read.badPriority).toContain('RenderableManager.setPriority()')
    expect(read.notRenderable).toContain('FilamentInvalidEntityError')
    expect(read.notLight).toContain('FilamentInvalidEntityError')
  })
})
