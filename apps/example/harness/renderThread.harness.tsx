import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { scheduleOnRN } from 'react-native-worklets'
import { Filament, runOnRenderThread, type Engine, type FrameInfo } from 'react-native-filament'
import { renderView } from './renderView'

describe('Render thread', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('runs jobs on the render thread', async () => {
    const onRenderThread = await runOnRenderThread(engine, () => {
      'worklet'
      return engine.renderThread.isCurrentThread
    })
    expect(onRenderThread).toBe(true)
    expect(engine.renderThread.isCurrentThread).toBe(false)
  })

  it('runs jobs in submission order', async () => {
    const order: Promise<number>[] = [1, 2, 3].map((value) =>
      runOnRenderThread(engine, () => {
        'worklet'
        const global = globalThis as { rnfOrder?: number[] }
        global.rnfOrder = [...(global.rnfOrder ?? []), value]
        return global.rnfOrder.length
      })
    )
    expect(await Promise.all(order)).toEqual([1, 2, 3])
  })

  it('settles Promises created on the render runtime of an idle engine', async () => {
    const value = await new Promise<number>((resolve) => {
      runOnRenderThread(engine, () => {
        'worklet'
        Promise.resolve(41).then((result) => scheduleOnRN(resolve, result + 1))
      })
    })
    expect(value).toBe(42)
  })

  it('reuses the render runtime of a shut-down engine and keeps concurrent engines apart', async () => {
    const marker = `runtime-${Date.now()}`
    await runOnRenderThread(engine, () => {
      'worklet'
      ;(globalThis as Record<string, unknown>).__rnfRuntimeMarker = marker
    })
    const concurrent = await Filament.createEngine({})
    const seenWhileFirstRuns = await runOnRenderThread(concurrent, () => {
      'worklet'
      return (globalThis as Record<string, unknown>).__rnfRuntimeMarker
    })
    await concurrent.shutdown()
    await engine.shutdown()
    const next = await Filament.createEngine({})
    const seenAfterShutdown = await runOnRenderThread(next, () => {
      'worklet'
      return (globalThis as Record<string, unknown>).__rnfRuntimeMarker
    })
    await next.shutdown()
    expect(seenWhileFirstRuns).not.toBe(marker)
    expect(seenAfterShutdown).toBe(marker)
  })

  it('rejects render-thread methods called from another thread', () => {
    expect(() => engine.addOnFrameListener(() => true)).toThrow('FilamentThreadError')
  })

  it('rejects jobs submitted after shutdown', async () => {
    const shutdown = engine.shutdown()
    await expect(
      runOnRenderThread(engine, () => {
        'worklet'
        return 1
      })
    ).rejects.toThrow('FilamentDisposedError')
    await shutdown
  })

  it('calls frame listeners once per rendered frame', async () => {
    const view = await renderView()
    await engine.createViewTarget(view, {})
    const frames = await new Promise<FrameInfo[]>((resolve) => {
      runOnRenderThread(engine, () => {
        'worklet'
        const seen: FrameInfo[] = []
        const subscription = engine.addOnFrameListener((frame) => {
          seen.push(frame)
          if (seen.length === 3) {
            subscription.remove()
            scheduleOnRN(resolve, seen)
          }
          return true
        })
      })
    })
    expect(frames[1]!.frameIndex - frames[0]!.frameIndex).toBe(1)
    expect(frames[2]!.frameIndex - frames[1]!.frameIndex).toBe(1)
    expect(frames[2]!.elapsedSeconds).toBeGreaterThan(frames[0]!.elapsedSeconds)
  })
})
