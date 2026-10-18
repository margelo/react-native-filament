import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { scheduleOnRN } from 'react-native-worklets'
import { Filament, runOnRenderThread, type Engine, type Mat4 } from 'react-native-filament'
import { renderView } from './renderView'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))
const avatar = Image.resolveAssetSource(require('../assets/morphtargets.glb'))
const dancer = Image.resolveAssetSource(require('../assets/hiphopgirl.glb'))

function attempt(run: () => unknown): string {
  'worklet'
  try {
    run()
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('Instances, morph targets and skins', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('creates instances at runtime and shows them in scenes that hold the model', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const result = await runOnRenderThread(engine, () => {
      'worklet'
      const scene = engine.createScene()
      scene.addModel(model)
      const before = scene.entityCount
      const created = model.createInstance()
      return { before, after: scene.entityCount, root: created.rootEntity, firstRoot: model.getInstance(0).rootEntity }
    })
    expect(model.instanceCount).toBe(2)
    expect(model.entities.length).toBe(2 * result.before)
    expect(result.after).toBe(2 * result.before)
    expect(result.root).not.toBe(result.firstRoot)
    expect(() => model.createInstance()).toThrow('FilamentThreadError')
  })

  it('names and drives morph targets', async () => {
    const model = await engine.loadModel({ uri: avatar.uri }, {})
    const result = await runOnRenderThread(engine, () => {
      'worklet'
      const rm = engine.renderableManager
      const head = model.getEntityByName('Wolf3D_Head')!
      const names = model.getMorphTargetNames(head)
      const count = rm.getMorphTargetCount(head)
      return {
        names,
        count,
        headName: model.getEntityName(head),
        rootName: model.getEntityName(model.rootEntity),
        set: attempt(() => rm.setMorphWeights(head, [1, 0.5], names.indexOf('mouthOpen'))),
        overflow: attempt(() => rm.setMorphWeights(head, [1, 1], count - 1)),
      }
    })
    expect(result.headName).toBe('Wolf3D_Head')
    expect(result.rootName).toBeUndefined()
    expect(result.count).toBe(72)
    expect(result.names.length).toBe(72)
    expect(result.names).toContain('mouthOpen')
    expect(result.set).toBe('ok')
    expect(result.overflow).toContain('morph targets')
  })

  it('reports skins and material variants and validates their indices', async () => {
    const model = await engine.loadModel({ uri: dancer.uri }, {})
    const instance = model.getInstance(0)
    expect(instance.skinCount).toBe(1)
    expect(instance.materialVariants).toEqual([])
    const result = await runOnRenderThread(engine, () => {
      'worklet'
      return {
        variant: attempt(() => instance.applyMaterialVariant(0)),
        skin: attempt(() => instance.attachSkin(3, model.rootEntity)),
        recompute: attempt(() => instance.recomputeBoundingBoxes()),
      }
    })
    expect(result.variant).toContain('material variants')
    expect(result.skin).toContain('skins')
    expect(result.recompute).toBe('ok')
  })

  it('copies joint transforms to a following instance every frame', async () => {
    const view = await renderView()
    const target = await engine.createViewTarget(view, {})
    const model = await engine.loadModel({ uri: dancer.uri }, { instanceCount: 2 })
    const leader = model.getInstance(0)
    const follower = model.getInstance(1)
    const hips = leader.entities.indexOf(model.getEntityByName('mixamorig:Hips')!)
    expect(hips).toBeGreaterThanOrEqual(0)
    const [leaderHips, followerHips] = await new Promise<[Mat4, Mat4]>((resolve) => {
      runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.addModel(model)
        target.setScene(scene)
        follower.followSkeleton(leader)
        leader.animator.applyAnimation(1, 1.3)
        const tm = engine.transformManager
        let frames = 0
        const subscription = engine.addOnFrameListener(() => {
          frames++
          if (frames < 2) return true
          subscription.remove()
          scheduleOnRN(resolve, [tm.getTransform(leader.entities[hips]!), tm.getTransform(follower.entities[hips]!)])
          return false
        })
      })
    })
    followerHips.forEach((value, index) => expect(value).toBeCloseTo(leaderHips[index]!, 4))
  })
})
