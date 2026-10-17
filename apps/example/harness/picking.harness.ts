import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { Filament, runOnRenderThread, type Engine, type Model, type ViewTarget } from 'react-native-filament'
import { renderView } from './renderView'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

describe('Picking and snapshots', () => {
  let engine: Engine
  let target: ViewTarget
  let model: Model

  beforeEach(async () => {
    engine = await Filament.createEngine({})
    target = await engine.createViewTarget(await renderView(), { clearOptions: { color: [1, 0, 0, 1] } })
    model = await engine.loadModel({ uri: coin.uri }, {})
    await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      scene.addModel(model)
      scene.addEntity(engine.createDirectionalLight({}).entity)
      engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
      const camera = engine.createCamera()
      camera.lookAt([0, 0, 6], [0, 0, 0], [0, 1, 0])
      camera.setProjection(45, 1, 0.1, 100)
      target.setScene(scene)
      target.setCamera(camera)
    })
    await new Promise<void>((resolve) => target.addOnFirstFrameListener(resolve))
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('picks the renderable under a point and its world position', async () => {
    const hit = await target.pick(100, 100)
    expect(hit).toBeDefined()
    expect(model.entities).toContain(hit!.entity)
    expect(Math.abs(hit!.worldPosition[0])).toBeLessThan(0.2)
    expect(Math.abs(hit!.worldPosition[1])).toBeLessThan(0.2)
    expect(await target.pick(3, 3)).toBeUndefined()
    expect(await target.pick(-50, 100)).toBeUndefined()
  })

  it('captures a frame top row first and saves it as a PNG that loads back', async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      engine.transformManager.setTranslation(model.rootEntity, [0, -1.4, 0])
    })
    const snapshot = await target.takeSnapshot()
    expect(snapshot.width).toBe(target.width)
    expect(snapshot.height).toBe(target.height)
    const pixels = new Uint8Array(snapshot.toArrayBuffer())
    expect(pixels.length).toBe(snapshot.width * snapshot.height * 4)
    const [red, green, blue, alpha] = Array.from(pixels.slice(0, 4))
    expect(red).toBeGreaterThan(200)
    expect(green).toBeLessThan(60)
    expect(blue).toBeLessThan(60)
    expect(alpha).toBe(255)
    const pixelAt = (x: number, y: number) => Array.from(pixels.slice((y * snapshot.width + x) * 4, (y * snapshot.width + x) * 4 + 3))
    const [topRed, topGreen] = pixelAt(Math.floor(snapshot.width / 2), Math.floor(snapshot.height * 0.15))
    const [coinRed, coinGreen] = pixelAt(Math.floor(snapshot.width / 2), Math.floor(snapshot.height * 0.8))
    expect(topRed! - topGreen!).toBeGreaterThan(150)
    expect(coinRed! - coinGreen!).toBeLessThan(150)
    const uri = await snapshot.saveToTemporaryFile()
    expect(uri).toMatch(/^file:\/\/.*\.png$/)
    const texture = await engine.loadTexture({ uri }, {})
    expect([texture.width, texture.height]).toEqual([snapshot.width, snapshot.height])
  })

  it('rejects queries of a target disposed before they finish', async () => {
    const pending = target.pick(100, 100)
    target.dispose()
    await expect(pending).rejects.toThrow('FilamentDisposedError')
  })
})
