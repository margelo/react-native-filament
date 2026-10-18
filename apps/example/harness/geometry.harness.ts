import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { Filament, runOnRenderThread, type Engine, type Material, type ViewTarget } from 'react-native-filament'
import { renderView } from './renderView'

const backgroundMaterial = Image.resolveAssetSource(require('../assets/background_image.filamat'))
const coin = Image.resolveAssetSource(require('../assets/coin.glb'))
const shadowMaterial = Image.resolveAssetSource(require('../assets/transparent_shadow_material.filamat'))

function attempt(run: () => unknown): string {
  'worklet'
  try {
    run()
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('Owned geometry', () => {
  let engine: Engine
  let shadow: Material

  beforeEach(async () => {
    engine = await Filament.createEngine({})
    shadow = await engine.loadMaterial({ uri: shadowMaterial.uri })
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('creates a plane facing up with its material and shadow defaults', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const rm = engine.renderableManager
      const plane = engine.createPlane({ width: 4, depth: 2 }, shadow.createInstance())
      return {
        primitives: rm.getPrimitiveCount(plane.entity),
        box: rm.getAxisAlignedBoundingBox(plane.entity),
        castsShadows: rm.isShadowCaster(plane.entity),
        receivesShadows: rm.isShadowReceiver(plane.entity),
        material: rm.getMaterialInstanceAt(plane.entity, 0).materialName,
      }
    })
    const [halfWidth, halfHeight, halfDepth] = read.box.halfExtent
    expect([read.box.center, halfWidth, halfDepth]).toEqual([[0, 0, 0], 2, 1])
    expect(halfHeight).toBeGreaterThan(0)
    expect(halfHeight).toBeLessThan(0.001)
    expect([read.primitives, read.castsShadows, read.receivesShadows, read.material]).toEqual([1, false, true, 'GroundShadow'])
  })

  it('rejects planes without area', async () => {
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      return attempt(() => engine.createPlane({ width: 0, depth: 1 }, shadow.createInstance()))
    })
    expect(message).toContain('positive width and depth')
  })

  it('removes the renderable from every scene when disposed', async () => {
    const { scenes, plane } = await runOnRenderThread(engine, () => {
      'worklet'
      const created = [engine.createScene(), engine.createScene()]
      const renderable = engine.createPlane({ width: 1, depth: 1 }, shadow.createInstance())
      const entity = renderable.entity
      for (const scene of created) scene.addEntity(entity)
      renderable.dispose()
      return { scenes: created, plane: entity }
    })
    const after = await runOnRenderThread(engine, () => {
      'worklet'
      return { counts: scenes.map((scene) => scene.entityCount), alive: engine.renderableManager.hasComponent(plane) }
    })
    expect(after).toEqual({ counts: [0, 0], alive: false })
  })

  it("falls back to its material's default instance when the assigned instance is disposed first", async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const instance = shadow.createInstance()
      const plane = engine.createPlane({ width: 1, depth: 1 }, instance)
      instance.dispose()
      return { entity: plane.entity, plane }
    })
    const material = await runOnRenderThread(engine, () => {
      'worklet'
      return engine.renderableManager.getMaterialInstanceAt(read.entity, 0).materialName
    })
    expect(material).toBe('GroundShadow')
  })

  describe('rendering', () => {
    let target: ViewTarget

    beforeEach(async () => {
      target = await engine.createViewTarget(await renderView(), { clearOptions: { color: [0, 0, 0, 1] } })
    })

    function centerPixel(pixels: Uint8Array, width: number, height: number, y = height / 2): number[] {
      const offset = (Math.floor(y) * width + Math.floor(width / 2)) * 4
      return Array.from(pixels.slice(offset, offset + 3))
    }

    it('fills the whole view with a background', async () => {
      const background = await engine.loadMaterial({ uri: backgroundMaterial.uri })
      await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const instance = background.createInstance()
        instance.setIntParameter('showImage', 0)
        instance.setFloat3Parameter('backgroundColor', [0, 0, 1])
        scene.addEntity(engine.createBackground(instance).entity)
        const camera = engine.createCamera()
        camera.setProjection(45, 1, 0.1, 100)
        target.setScene(scene)
        target.setCamera(camera)
      })
      const snapshot = await target.takeSnapshot()
      const pixels = new Uint8Array(snapshot.toArrayBuffer())
      for (const y of [1, snapshot.height / 2, snapshot.height - 2]) {
        const [red, green, blue] = centerPixel(pixels, snapshot.width, snapshot.height, y)
        expect(blue! - red!).toBeGreaterThan(80)
        expect(blue! - green!).toBeGreaterThan(80)
      }
    })

    it('darkens a shadow catcher plane only where a caster blocks the light', async () => {
      const model = await engine.loadModel({ uri: coin.uri }, {})
      await runOnRenderThread(engine, () => {
        'worklet'
        target.setClearOptions({ color: [1, 1, 1, 1] })
        target.view.shadowType = 'vsm'
        const rm = engine.renderableManager
        const scene = engine.createScene()
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        for (const entity of model.entities) {
          if (rm.hasComponent(entity)) rm.setCastShadows(entity, true)
        }
        scene.addEntity(engine.createDirectionalLight({ direction: [1, -1, 0], castShadows: true }).entity)
        const instance = shadow.createInstance()
        instance.setFloatParameter('strength', 1)
        const plane = engine.createPlane({ width: 10, depth: 10 }, instance)
        engine.transformManager.setTranslation(plane.entity, [0, -2, 0])
        scene.addEntity(plane.entity)
        const camera = engine.createCamera()
        camera.lookAt([0, 6, 0], [0, 0, 0], [0, 0, -1])
        camera.setProjection(45, 1, 0.1, 100)
        target.setScene(scene)
        target.setCamera(camera)
      })
      const snapshot = await target.takeSnapshot()
      const pixels = new Uint8Array(snapshot.toArrayBuffer())
      const brightnessBetween = (from: number, to: number) => {
        let sum = 0
        let count = 0
        for (let y = Math.floor(snapshot.height * 0.4); y < snapshot.height * 0.6; y++) {
          for (let x = Math.floor(snapshot.width * from); x < snapshot.width * to; x++) {
            const offset = (y * snapshot.width + x) * 4
            sum += pixels[offset]! + pixels[offset + 1]! + pixels[offset + 2]!
            count++
          }
        }
        return sum / count / 3
      }
      const lit = brightnessBetween(0.1, 0.2)
      expect(lit).toBeGreaterThan(200)
      expect(brightnessBetween(0.8, 0.9)).toBeLessThan(40)
    })

    it('draws a debug box as colored edges only', async () => {
      await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const box = engine.createDebugBox({ halfExtent: [1, 1, 1], center: [0, 0, 0], color: [1, 0, 0, 1] })
        scene.addEntity(box.entity)
        const camera = engine.createCamera()
        camera.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
        camera.setProjection(45, 1, 0.1, 100)
        target.setScene(scene)
        target.setCamera(camera)
      })
      const snapshot = await target.takeSnapshot()
      const pixels = new Uint8Array(snapshot.toArrayBuffer())
      let redPixels = 0
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (pixels[offset]! - pixels[offset + 1]! > 80 && pixels[offset]! - pixels[offset + 2]! > 80) redPixels++
      }
      expect(redPixels).toBeGreaterThan(snapshot.width)
      expect(redPixels).toBeLessThan((snapshot.width * snapshot.height) / 4)
      expect(Math.max(...centerPixel(pixels, snapshot.width, snapshot.height))).toBeLessThan(20)
    })
  })
})
