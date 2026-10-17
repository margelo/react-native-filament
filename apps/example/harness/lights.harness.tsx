import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { defaultIndirectLightSource, Filament, runOnRenderThread, type Engine } from 'react-native-filament'
import { renderView } from './renderView'

describe('Lights', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('removes a directional light from scenes when it is disposed', async () => {
    const { scene, added } = await runOnRenderThread(engine, () => {
      'worklet'
      const created = engine.createScene()
      const light = engine.createDirectionalLight({ intensityLux: 50000, colorKelvin: 5000, castShadows: false })
      created.addEntity(light.entity)
      light.dispose()
      return { scene: created, added: created.entityCount }
    })
    const afterDispose = await runOnRenderThread(engine, () => {
      'worklet'
      return scene.entityCount
    })
    expect([added, afterDispose]).toEqual([1, 0])
  })

  it('loads the bundled indirect light', async () => {
    const light = await engine.loadIndirectLight(defaultIndirectLightSource, { intensity: 20000 })
    await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      scene.setIndirectLight(light)
      light.dispose()
      scene.setIndirectLight(undefined)
    })
  })

  it('rejects files that are not KTX1 cubemaps', async () => {
    await expect(engine.loadIndirectLight(new Uint8Array(128).buffer, {})).rejects.toThrow('FilamentAssetError')
  })

  it('reports the drawable size to resize listeners', async () => {
    const view = await renderView()
    const target = await engine.createViewTarget(view, {})
    const size = await new Promise<[number, number]>((resolve) => {
      target.addOnResizeListener((width, height) => resolve([width, height]))
    })
    expect(size[0]).toBeGreaterThan(0)
    expect(size).toEqual([target.width, target.height])
  })
})
