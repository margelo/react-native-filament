import React from 'react'
import { afterEach, beforeEach, describe, expect, it, render } from 'react-native-harness'
import { callback } from 'react-native-nitro-modules'
import { scheduleOnRN } from 'react-native-worklets'
import { Filament, NativeFilamentView, runOnRenderThread, type Engine, type FilamentView, type FrameInfo } from 'react-native-filament'

function renderView(): Promise<FilamentView> {
  return new Promise((resolve) => {
    render(<NativeFilamentView style={{ width: 200, height: 200 }} hybridRef={callback(resolve)} />)
  })
}

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
