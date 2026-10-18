import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { NitroModules } from 'react-native-nitro-modules'
import { Filament, runOnRenderThread, type Engine } from 'react-native-filament'

describe('Resources', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('fails other wrappers of a disposed object with FilamentDisposedError', async () => {
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      const boxed = NitroModules.box(scene)
      scene.dispose()
      try {
        return String(boxed.unbox().entityCount)
      } catch (error) {
        return error instanceof Error ? error.message : String(error)
      }
    })
    expect(message).toContain('FilamentDisposedError')
  })

  it('rejects entities without a renderable or light component', async () => {
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      const camera = engine.createCamera()
      try {
        scene.addEntity(camera.entity)
        return 'added'
      } catch (error) {
        return error instanceof Error ? error.message : String(error)
      }
    })
    expect(message).toContain('FilamentInvalidEntityError')
  })

  it('rejects objects from another engine', async () => {
    const other = await Filament.createEngine({})
    const skybox = await runOnRenderThread(other, () => {
      'worklet'
      return other.createSkybox([1, 0, 0, 1])
    })
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      try {
        engine.createScene().setSkybox(skybox)
        return 'set'
      } catch (error) {
        return error instanceof Error ? error.message : String(error)
      }
    })
    expect(message).toContain('FilamentEngineMismatchError')
    await other.shutdown()
  })

  it('keeps scenes usable while a camera is disposed', async () => {
    const count = await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      engine.createCamera().dispose()
      return scene.entityCount
    })
    expect(count).toBe(0)
  })
})
