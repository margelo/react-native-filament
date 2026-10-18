import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { Filament, runOnRenderThread, type Engine } from 'react-native-filament'

const backgroundMaterial = Image.resolveAssetSource(require('../assets/background_image.filamat'))
const blueBaseColor = Image.resolveAssetSource(require('../assets/rocket_BaseColor_Blue.png'))
const rocket = Image.resolveAssetSource(require('../assets/rocket.glb'))
const skybox = Image.resolveAssetSource(require('../assets/default_env_skybox.ktx'))

function attempt(run: () => unknown): string {
  'worklet'
  try {
    run()
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('Materials and textures', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('loads a material and validates parameter names and types', async () => {
    const material = await engine.loadMaterial({ uri: backgroundMaterial.uri })
    expect(material.materialName).toBe('Image')
    expect(material.parameterNames).toEqual(expect.arrayContaining(['image', 'transform', 'backgroundColor', 'showImage']))
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const instance = material.createInstance()
      instance.setIntParameter('showImage', 1)
      instance.setColorParameter('backgroundColor', [1, 0.5, 0, 1], 'srgb')
      return {
        showImage: instance.getIntParameter('showImage'),
        color: instance.getFloat3Parameter('backgroundColor'),
        missing: attempt(() => instance.setFloatParameter('nope', 1)),
        wrongType: attempt(() => instance.setFloatParameter('backgroundColor', 1)),
        culling: instance.cullingMode,
      }
    })
    expect(read.showImage).toBe(1)
    expect(read.color[0]).toBeCloseTo(1, 3)
    expect(read.color[1]).toBeCloseTo(0.214, 2)
    expect(read.missing).toContain('has no parameter "nope"')
    expect(read.wrongType).toContain('is not a float')
    expect(read.culling).toBe('none')
  })

  it('rejects files that are not materials of this Filament version', async () => {
    const oldVersion = new Uint8Array(32)
    oldVersion.set([...'SREV_TAM'].map((char) => char.charCodeAt(0)))
    oldVersion.set([4, 0, 0, 0, 68, 0, 0, 0], 8)
    await expect(engine.loadMaterial(oldVersion.buffer)).rejects.toThrow('material version 68')
    await expect(engine.loadMaterial(new Uint8Array(64).buffer)).rejects.toThrow('not a compiled Filament material')
  })

  it('decodes textures and binds them to samplers', async () => {
    const [texture, material] = await Promise.all([
      engine.loadTexture({ uri: blueBaseColor.uri }, {}),
      engine.loadMaterial({ uri: backgroundMaterial.uri }),
    ])
    expect(texture.width).toBeGreaterThan(0)
    expect(texture.height).toBeGreaterThan(0)
    const outcome = await runOnRenderThread(engine, () => {
      'worklet'
      const instance = material.createInstance()
      instance.setTexture('image', texture, { minFilter: 'linear', wrapS: 'clamp-to-edge' })
      return attempt(() => instance.setTexture('backgroundColor', texture, {}))
    })
    expect(outcome).toContain('is not a sampler')
    texture.dispose()
    await expect(engine.loadTexture(new Uint8Array([1, 2, 3]).buffer, {})).rejects.toThrow('PNG, JPEG or KTX2')
  })

  it('reads and replaces the material instances of a model', async () => {
    const [model, material, texture] = await Promise.all([
      engine.loadModel({ uri: rocket.uri }, {}),
      engine.loadMaterial({ uri: backgroundMaterial.uri }),
      engine.loadTexture({ uri: blueBaseColor.uri }, {}),
    ])
    const outcome = await runOnRenderThread(engine, () => {
      'worklet'
      const rm = engine.renderableManager
      const tip = model.getEntityByName('Tip')!
      const borrowed = rm.getMaterialInstanceAt(tip, 0)
      borrowed.setTexture('baseColorMap', texture, {})
      const wings = model.getEntityByName('Wings')!
      return {
        name: borrowed.instanceName,
        borrowedAssignment: attempt(() => rm.setMaterialInstanceAt(wings, 0, borrowed)),
        ownAssignment: attempt(() => rm.setMaterialInstanceAt(wings, 0, material.createInstance())),
        replacedName: rm.getMaterialInstanceAt(wings, 0).materialName,
        borrowed,
      }
    })
    expect(outcome.name).toBe('Toy Ship')
    expect(outcome.borrowedAssignment).toContain('Material.createInstance()')
    expect(outcome.ownAssignment).toBe('ok')
    expect(outcome.replacedName).toBe('Image')
    model.dispose()
    const afterDispose = await runOnRenderThread(engine, () => {
      'worklet'
      return attempt(() => outcome.borrowed.instanceName)
    })
    expect(afterDispose).toContain('FilamentDisposedError')
  })

  it('loads a KTX1 skybox', async () => {
    const background = await engine.loadSkybox({ uri: skybox.uri })
    await runOnRenderThread(engine, () => {
      'worklet'
      engine.createScene().setSkybox(background)
    })
    await expect(engine.loadSkybox(new Uint8Array(128).buffer)).rejects.toThrow('not a KTX1 file')
  })
})
