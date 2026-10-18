import React, { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, render, waitUntil } from 'react-native-harness'
import {
  Filament,
  FilamentScene,
  runOnRenderThread,
  useFilamentContext,
  useWorkletCallback,
  useWorkletEffect,
  useWorkletMemo,
  type Engine,
  type WorkletContext,
} from 'react-native-filament'

function readLog(engine: Engine, key: string): Promise<string[]> {
  return runOnRenderThread(engine, () => {
    'worklet'
    return (globalThis as unknown as Record<string, string[] | undefined>)[key] ?? []
  })
}

describe('1.x worklet hooks', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('reruns useWorkletEffect only when a captured value changes, with cleanups on the render thread', async () => {
    const key = `worklet-effect-${Date.now()}`

    function Effect({ value }: { value: number }) {
      const { engine: current } = useFilamentContext()
      useWorkletEffect(() => {
        'worklet'
        const log = globalThis as unknown as Record<string, string[] | undefined>
        log[key] = [...(log[key] ?? []), `run:${value}:${current.renderThread.isCurrentThread}`]
        return () => {
          'worklet'
          const cleanupLog = globalThis as unknown as Record<string, string[] | undefined>
          cleanupLog[key] = [...(cleanupLog[key] ?? []), `cleanup:${value}:${current.renderThread.isCurrentThread}`]
        }
      })
      return null
    }

    const tree = (value: number) => (
      <FilamentScene engine={engine}>
        <Effect value={value} />
      </FilamentScene>
    )
    const rendered = await render(tree(1))
    await waitUntil(async () => (await readLog(engine, key)).length === 1, 5000)
    await rendered.rerender(tree(1))
    await rendered.rerender(tree(2))
    await waitUntil(async () => (await readLog(engine, key)).length === 3, 5000)
    rendered.unmount()
    await waitUntil(async () => (await readLog(engine, key)).length === 4, 5000)
    expect(await readLog(engine, key)).toEqual(['run:1:true', 'cleanup:1:true', 'run:2:true', 'cleanup:2:true'])
  })

  it('runs useWorkletCallback and useWorkletMemo on the render thread with their captured values', async () => {
    interface Probe {
      scale: (value: number) => Promise<{ scaled: number; onRenderThread: boolean }>
      memo: { doubled: number; onRenderThread: boolean } | undefined
    }
    let latest: Probe | undefined

    function Hooks({ factor }: { factor: number }) {
      const { engine: current } = useFilamentContext()
      const scale = useWorkletCallback((value: number) => {
        'worklet'
        return { scaled: value * factor, onRenderThread: current.renderThread.isCurrentThread }
      })
      const memo = useWorkletMemo(() => {
        'worklet'
        return { doubled: factor * 2, onRenderThread: current.renderThread.isCurrentThread }
      }, [factor, current])
      useEffect(() => {
        latest = { scale, memo }
      }, [scale, memo])
      return null
    }

    const tree = (factor: number) => (
      <FilamentScene engine={engine}>
        <Hooks factor={factor} />
      </FilamentScene>
    )
    const rendered = await render(tree(3))
    await waitUntil(() => latest?.memo?.doubled === 6, 5000)
    expect(latest?.memo).toEqual({ doubled: 6, onRenderThread: true })
    expect(await latest!.scale(5)).toEqual({ scaled: 15, onRenderThread: true })

    await rendered.rerender(tree(4))
    await waitUntil(() => latest?.memo?.doubled === 8, 5000)
    expect(await latest!.scale(5)).toEqual({ scaled: 20, onRenderThread: true })
    rendered.unmount()
  })

  it('runs worklets through workletContext like 1.x', async () => {
    let context: WorkletContext | undefined

    function Context() {
      const { workletContext } = useFilamentContext()
      useEffect(() => {
        context = workletContext
      }, [workletContext])
      return null
    }

    const rendered = await render(
      <FilamentScene engine={engine}>
        <Context />
      </FilamentScene>
    )
    await waitUntil(() => context != null, 5000)
    const thread = engine.renderThread
    const onRenderThread = await context!.runAsync(() => {
      'worklet'
      return thread.isCurrentThread
    })
    const add = context!.createRunAsync((a: number, b: number) => {
      'worklet'
      return thread.isCurrentThread ? a + b : -1
    })
    expect(onRenderThread).toBe(true)
    expect(await add(2, 3)).toBe(5)
    rendered.unmount()
  })
})
