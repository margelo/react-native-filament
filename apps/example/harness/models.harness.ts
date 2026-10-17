import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { Filament, runOnRenderThread, type Engine } from 'react-native-filament'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))
const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))

describe('Models', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('loads a model from a URI before any view exists', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    expect(model.instanceCount).toBe(1)
    expect(model.entities.length).toBeGreaterThan(0)
    expect(model.getEntityByName('skull coin reference')).toBe(model.entities.find((entity) => entity !== model.rootEntity))
    expect(model.getEntityByName('missing node')).toBeUndefined()
    expect(model.boundingBox.halfExtent[0]).toBeGreaterThan(0)
  })

  it('copies an ArrayBuffer source when the call is made', async () => {
    const bytes = await fetch(coin.uri).then((response) => response.arrayBuffer())
    const loading = engine.loadModel(bytes, {})
    new Uint8Array(bytes).fill(0)
    const model = await loading
    expect(model.entities.length).toBeGreaterThan(0)
  })

  it('rejects bytes that are not a glTF binary', async () => {
    await expect(engine.loadModel(new Uint8Array([1, 2, 3, 4]).buffer, {})).rejects.toThrow('FilamentAssetError')
  })

  it('rejects a bundled asset that does not exist', async () => {
    await expect(engine.loadModel({ uri: 'missing_model.glb' }, {})).rejects.toThrow('missing_model.glb')
  })

  it('creates instances that share one model', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, { instanceCount: 3 })
    const roots = [0, 1, 2].map((index) => model.getInstance(index).rootEntity)
    expect(new Set(roots).size).toBe(3)
    expect(() => model.getInstance(3)).toThrow('Model.getInstance()')
  })

  it('adds and removes every entity of a model in a scene', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, { instanceCount: 2 })
    const { scene, counts } = await runOnRenderThread(engine, () => {
      'worklet'
      const created = engine.createScene()
      created.addModel(model)
      created.addModel(model)
      const added = created.entityCount
      created.removeModel(model)
      const removed = created.entityCount
      created.addModel(model)
      model.dispose()
      return { scene: created, counts: [added, removed] }
    })
    expect(counts).toEqual([model.entities.length, 0])
    const afterDispose = await runOnRenderThread(engine, () => {
      'worklet'
      return scene.entityCount
    })
    expect(afterDispose).toBe(0)
  })

  it('exposes animations and applies them only on the render thread', async () => {
    const model = await engine.loadModel({ uri: drone.uri }, {})
    const animator = model.getInstance(0).animator
    expect(animator.animations.length).toBe(1)
    expect(animator.animations[0]!.durationSeconds).toBeGreaterThan(0)
    expect(() => animator.applyAnimation(0, 0)).toThrow('FilamentThreadError')
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      animator.applyAnimation(0, 0.5)
      animator.updateBoneMatrices()
      try {
        animator.applyAnimation(1, 0)
        return 'applied'
      } catch (error) {
        return error instanceof Error ? error.message : String(error)
      }
    })
    expect(message).toContain('Animator.applyAnimation()')
  })

  it('stops accepting player commands once the model is disposed', async () => {
    const model = await engine.loadModel({ uri: drone.uri }, {})
    const player = model.getInstance(0).animator.createPlayer()
    player.play(0, { loop: false, speed: 2, crossFadeSeconds: 0.2 })
    player.pause()
    player.seek(1)
    expect(() => player.play(4, {})).toThrow('AnimationPlayer.play()')
    model.dispose()
    expect(() => player.play(0, {})).toThrow('FilamentDisposedError')
  })

  it('rejects pending loads when the engine shuts down', async () => {
    const loading = engine.loadModel({ uri: drone.uri }, {})
    const shutdown = engine.shutdown()
    await expect(loading).rejects.toThrow('shut down')
    await shutdown
  })
})
