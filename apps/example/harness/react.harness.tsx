import React, { StrictMode, useEffect } from 'react'
import { Image } from 'react-native'
import { makeMutable } from 'react-native-reanimated'
import { afterEach, beforeEach, describe, expect, it, render, waitUntil } from 'react-native-harness'
import { runOnUIAsync, scheduleOnRN } from 'react-native-worklets'
import {
  Camera,
  DefaultLight,
  Filament,
  FilamentScene,
  FilamentView,
  ModelRenderer,
  runOnRenderThread,
  unitCubeTransform,
  useFilamentContext,
  useModel,
  useRenderThreadCallback,
  useRenderThreadEffect,
  type Engine,
  type FilamentContextValue,
  type Float3,
  type Mat4,
  type Model,
  type TransformationProps,
} from 'react-native-filament'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

interface Probe {
  context: FilamentContextValue
  model: Model
  /** The scene's entity count, read after the render-thread work of the current commit. */
  entityCount: () => Promise<number>
}

function Coin({ onReady, ...transform }: TransformationProps & { onReady: (probe: Probe) => void }) {
  const context = useFilamentContext()
  const model = useModel(coin.uri)
  const { scene } = context
  const entityCount = useRenderThreadCallback(() => {
    'worklet'
    return scene.entityCount
  }, [scene])
  useEffect(() => {
    if (model.state === 'loaded') onReady({ context, model: model.model, entityCount })
  }, [model, context, entityCount, onReady])
  return <ModelRenderer model={model} {...transform} />
}

function readTransform(engine: Engine, entity: number): Promise<Mat4> {
  return new Promise((resolve) => {
    runOnRenderThread(engine, () => {
      'worklet'
      engine.addOnFrameListener(() => {
        scheduleOnRN(resolve, engine.transformManager.getTransform(entity))
        return false
      })
      engine.requestFrame()
    })
  })
}

function expectClose(actual: number[], expected: number[]) {
  expect(actual.length).toBe(expected.length)
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index]!, 4))
}

function liveCount(engine: Engine, kind: string): number {
  return engine.getDebugStats().liveResources[kind] ?? 0
}

function hasNoLiveResources(engine: Engine): boolean {
  return Object.keys(engine.getDebugStats().liveResources).length === 0
}

describe('React API', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('shows a model in a borrowed engine and disposes everything it created on unmount', async () => {
    let onReady: (probe: Probe) => void = () => {}
    const ready = new Promise<Probe>((resolve) => {
      onReady = resolve
    })
    const rendered = await render(
      <FilamentScene engine={engine}>
        <FilamentView style={{ width: 200, height: 200 }}>
          <Camera />
          <DefaultLight />
          <Coin onReady={onReady} transformToUnitCube translate={[0, 1, 0]} />
        </FilamentView>
      </FilamentScene>
    )
    const { model, entityCount } = await ready
    await waitUntil(async () => (await entityCount()) === model.entities.length + 1, 5000)
    await waitUntil(() => liveCount(engine, 'IndirectLight') === 1 && liveCount(engine, 'ViewTarget') === 1, 5000)
    expect(['Model', 'Scene', 'Camera', 'Light'].map((kind) => liveCount(engine, kind))).toEqual([1, 1, 1, 1])

    const expected = unitCubeTransform(model.boundingBox)
    expected[13] += 1
    expectClose(await readTransform(engine, model.rootEntity), expected)

    rendered.unmount()
    await waitUntil(() => hasNoLiveResources(engine), 5000)
  })

  it('adds the model once and leaks nothing under StrictMode', async () => {
    let onReady: (probe: Probe) => void = () => {}
    const ready = new Promise<Probe>((resolve) => {
      onReady = resolve
    })
    const rendered = await render(
      <StrictMode>
        <FilamentScene engine={engine}>
          <FilamentView style={{ width: 200, height: 200 }}>
            <Camera />
            <Coin onReady={onReady} />
          </FilamentView>
        </FilamentScene>
      </StrictMode>
    )
    const { model, entityCount } = await ready
    expect(await entityCount()).toBe(model.entities.length)
    rendered.unmount()
    await waitUntil(() => hasNoLiveResources(engine), 5000)
  })

  it('creates and shuts down its own engine', async () => {
    let onReady: (probe: Probe) => void = () => {}
    const ready = new Promise<Probe>((resolve) => {
      onReady = resolve
    })
    const rendered = await render(
      <FilamentScene>
        <FilamentView style={{ width: 200, height: 200 }}>
          <Camera />
          <Coin onReady={onReady} />
        </FilamentView>
      </FilamentScene>
    )
    const owned = (await ready).context.engine
    expect(owned).not.toBe(engine)
    expect(liveCount(owned, 'Model')).toBe(1)
    rendered.unmount()
    await owned.shutdown()
    expect(hasNoLiveResources(owned)).toBe(true)
  })

  it('runs render-thread effects and their cleanups in order, also under StrictMode', async () => {
    const key = `effects-${Date.now()}`

    function Effects({ value }: { value: number }) {
      useRenderThreadEffect(() => {
        'worklet'
        const log = globalThis as unknown as Record<string, string[] | undefined>
        log[key] = [...(log[key] ?? []), `run:${value}`]
        return () => {
          'worklet'
          const cleanupLog = globalThis as unknown as Record<string, string[] | undefined>
          cleanupLog[key] = [...(cleanupLog[key] ?? []), `cleanup:${value}`]
        }
      }, [value])
      return null
    }

    const tree = (value: number) => (
      <StrictMode>
        <FilamentScene engine={engine}>
          <Effects value={value} />
        </FilamentScene>
      </StrictMode>
    )
    const readLog = () =>
      runOnRenderThread(engine, () => {
        'worklet'
        return (globalThis as unknown as Record<string, string[] | undefined>)[key] ?? []
      })
    const rendered = await render(tree(1))
    await waitUntil(async () => (await readLog()).length === 3, 5000)
    await rendered.rerender(tree(2))
    await waitUntil(async () => (await readLog()).length === 5, 5000)
    rendered.unmount()
    await waitUntil(async () => (await readLog()).length === 6, 5000)
    expect(await readLog()).toEqual(['run:1', 'cleanup:1', 'run:1', 'cleanup:1', 'run:2', 'cleanup:2'])
  })

  it('moves the camera and a model with SharedValues without re-rendering', async () => {
    const position = makeMutable<Float3>([0, 0, 8])
    const translate = makeMutable<Float3>([0, 0, 0])
    let renders = 0
    let onReady: (probe: Probe) => void = () => {}
    const ready = new Promise<Probe>((resolve) => {
      onReady = resolve
    })

    function Animated() {
      renders++
      return (
        <FilamentScene engine={engine}>
          <FilamentView style={{ width: 200, height: 200 }}>
            <Camera cameraPosition={position} />
            <Coin onReady={onReady} translate={translate} />
          </FilamentView>
        </FilamentScene>
      )
    }

    await render(<Animated />)
    const { context, model } = await ready
    await readTransform(engine, model.rootEntity)
    const rendersBefore = renders

    await runOnUIAsync(() => {
      'worklet'
      position.value = [3, 0, 4]
      translate.value = [1, 2, 3]
    })
    const cameraTransform = await readTransform(engine, context.camera.entity)
    const modelTransform = await readTransform(engine, model.rootEntity)

    expectClose([cameraTransform[12], cameraTransform[13], cameraTransform[14]], [3, 0, 4])
    expectClose([cameraTransform[8], cameraTransform[9], cameraTransform[10]], [0.6, 0, 0.8])
    expectClose([modelTransform[12], modelTransform[13], modelTransform[14]], [1, 2, 3])
    expect(renders).toBe(rendersBefore)
  })
})
