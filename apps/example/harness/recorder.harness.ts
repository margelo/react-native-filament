import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { NitroModules, type HybridObject } from 'react-native-nitro-modules'
import { Filament, runOnRenderThread, type Engine, type Model, type Recorder } from 'react-native-filament'
import { readMp4Info } from './mp4'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

interface AssetIO extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  read(uri: string): Promise<ArrayBuffer>
}

const assetIO = NitroModules.createHybridObject<AssetIO>('AssetIO')

function createRecorder(engine: Engine, model: Model): Promise<Recorder> {
  return runOnRenderThread(engine, () => {
    'worklet'
    const created = engine.createRecorder({ width: 321, height: 240, fps: 30, clearOptions: { color: [0.2, 0.4, 0.8, 1] } })
    const scene = engine.createScene()
    scene.addModel(model)
    scene.addEntity(engine.createDirectionalLight({}).entity)
    engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
    const camera = engine.createCamera()
    camera.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0])
    camera.setProjection(45, created.width / created.height, 0.1, 100)
    created.setScene(scene)
    created.setCamera(camera)
    return created
  })
}

function attempt(run: () => unknown): string {
  'worklet'
  try {
    run()
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('Recorder', () => {
  let engine: Engine
  let model: Model
  let recorder: Recorder

  beforeEach(async () => {
    engine = await Filament.createEngine({})
    model = await engine.loadModel({ uri: coin.uri }, {})
    recorder = await createRecorder(engine, model)
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('writes an MP4 with the requested size, frame count and duration', async () => {
    expect([recorder.width, recorder.height, recorder.fps]).toEqual([320, 240, 30])
    const uri = await recorder.record(45)
    expect(uri).toMatch(/^file:\/\/.*\.mp4$/)
    const info = readMp4Info(await assetIO.read(uri))
    expect([info.width, info.height, info.sampleCount]).toEqual([320, 240, 45])
    expect(Math.abs(info.durationSeconds - 1.5)).toBeLessThan(0.1)
  })

  it('runs frame listeners on a fixed clock before each frame', async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      const frames: number[][] = []
      ;(globalThis as Record<string, unknown>).__recordedFrames = frames
      engine.addOnFrameListener((frame) => {
        frames.push([frame.frameIndex, frame.elapsedSeconds, frame.deltaSeconds])
        return true
      })
    })
    await recorder.record(4)
    const frames = await runOnRenderThread(engine, () => {
      'worklet'
      return (globalThis as Record<string, unknown>).__recordedFrames as number[][]
    })
    expect(frames).toEqual([
      [0, 0, 0],
      [1, 1 / 30, 1 / 30],
      [2, 2 / 30, 1 / 30],
      [3, 3 / 30, 1 / 30],
    ])
  })

  it('records again after a recording finishes and rejects overlapping recordings', async () => {
    const first = recorder.record(20)
    await expect(recorder.record(5)).rejects.toThrow('FilamentBusyError')
    const [firstUri, secondUri] = [await first, await recorder.record(5)]
    expect(firstUri).not.toBe(secondUri)
    expect(readMp4Info(await assetIO.read(firstUri)).sampleCount).toBe(20)
    expect(readMp4Info(await assetIO.read(secondUri)).sampleCount).toBe(5)
  })

  it('rejects the pending recording when the recorder is disposed', async () => {
    const recording = recorder.record(600)
    await runOnRenderThread(engine, () => {
      'worklet'
    })
    recorder.dispose()
    await expect(recording).rejects.toThrow('FilamentDisposedError')
  })

  it('rejects a recording disposed between frames, and the engine records again', async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      engine.addOnFrameListener((frame) => {
        if (frame.frameIndex === 10) {
          recorder.dispose()
        }
        return true
      })
    })
    await expect(recorder.record(600)).rejects.toThrow('FilamentDisposedError')
    const next = await createRecorder(engine, model)
    expect(readMp4Info(await assetIO.read(await next.record(5))).sampleCount).toBe(5)
  })

  it('rejects the pending recording when the engine shuts down mid-recording', async () => {
    const recording = recorder.record(600)
    await runOnRenderThread(engine, () => {
      'worklet'
    })
    await engine.shutdown()
    await expect(recording).rejects.toThrow('FilamentDisposedError')
  })

  it('validates frame counts and sizes', async () => {
    expect(() => recorder.record(0)).toThrow('positive whole number')
    expect(() => recorder.record(2.5)).toThrow('positive whole number')
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      return attempt(() => engine.createRecorder({ width: 1, height: 100, fps: 30 }))
    })
    expect(message).toContain('at least 2 pixels')
  })
})
