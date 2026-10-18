import React from 'react'
import { afterEach, beforeEach, describe, expect, it, render, waitUntil } from 'react-native-harness'
import { Camera, Filament, FilamentScene, FilamentView, runOnRenderThread, type Engine, type EngineBackend } from 'react-native-filament'
import { renderView, renderViews } from './renderView'

const backend: EngineBackend | undefined = Filament.supportedBackends.find((supported) => supported === 'vulkan')

interface ViewsProps {
  engine?: Engine
  count: number
  transparent: boolean
  onFirstFrame?: () => void
}

function Views({ engine, count, transparent, onFirstFrame }: ViewsProps) {
  const views = Array.from({ length: count }, (_, index) => (
    <FilamentView key={index} transparent={transparent} onFirstFrame={onFirstFrame} style={{ width: 80, height: 80 }}>
      <Camera />
    </FilamentView>
  ))
  return engine == null ? <FilamentScene backend={backend}>{views}</FilamentScene> : <FilamentScene engine={engine}>{views}</FilamentScene>
}

function firstFrame(): { shown: Promise<void>; onFirstFrame: () => void } {
  let onFirstFrame: () => void = () => {}
  const shown = new Promise<void>((resolve) => {
    onFirstFrame = resolve
  })
  return { shown, onFirstFrame }
}

function hasNoLiveResources(engine: Engine): boolean {
  return Object.keys(engine.getDebugStats().liveResources).length === 0
}

describe('Surfaces', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({ backend })
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('mounts and unmounts views in consecutive commits', async () => {
    const rendered = await render(<Views engine={engine} count={0} transparent={false} />)
    for (let round = 0; round < 12; round++) {
      await rendered.rerender(<Views engine={engine} count={4} transparent={round % 2 === 1} />)
      await rendered.rerender(<Views engine={engine} count={round % 3} transparent={false} />)
    }
    const final = firstFrame()
    await rendered.rerender(
      <FilamentScene engine={engine}>
        <FilamentView key="final" onFirstFrame={final.onFirstFrame} style={{ width: 80, height: 80 }}>
          <Camera />
        </FilamentView>
      </FilamentScene>
    )
    await final.shown
    rendered.unmount()
    await waitUntil(() => hasNoLiveResources(engine), 10000)
  })

  it('shuts down owned engines while their views tear down', async () => {
    for (let round = 0; round < 8; round++) {
      const frame = firstFrame()
      const rendered = await render(<Views count={2} transparent={round % 2 === 1} onFirstFrame={frame.onFirstFrame} />)
      if (round % 4 >= 2) await frame.shown
      rendered.unmount()
    }
    const final = firstFrame()
    const rendered = await render(<Views engine={engine} count={1} transparent={false} onFirstFrame={final.onFirstFrame} />)
    await final.shown
    rendered.unmount()
    await waitUntil(() => hasNoLiveResources(engine), 10000)
  })

  it('moves one view between engines', async () => {
    const other = await Filament.createEngine({ backend })
    try {
      const view = await renderView()
      for (let round = 0; round < 8; round++) {
        const target = await (round % 2 === 0 ? engine : other).createViewTarget(view, {})
        if (round % 3 === 2) await new Promise<void>((resolve) => target.addOnFirstFrameListener(resolve))
        target.dispose()
      }
      const last = await engine.createViewTarget(view, {})
      await runOnRenderThread(engine, () => {
        'worklet'
        last.setScene(engine.createScene())
      })
      await new Promise<void>((resolve) => last.addOnFirstFrameListener(resolve))
      expect(last.width).toBeGreaterThan(0)
    } finally {
      await other.shutdown()
    }
  })

  it('renders more views on one engine than Vulkan has timer queries for', async () => {
    const views = await renderViews(12)
    const targets = await Promise.all(
      views.map((view, index) => engine.createViewTarget(view, { clearOptions: { color: index % 2 === 0 ? [1, 0, 0, 1] : [0, 0, 1, 1] } }))
    )
    await Promise.all(targets.map((target) => new Promise<void>((resolve) => target.addOnFirstFrameListener(resolve))))
    const snapshots = await Promise.all(targets.map((target) => target.takeSnapshot()))
    snapshots.forEach((snapshot, index) => {
      const [red, , blue] = Array.from(new Uint8Array(snapshot.toArrayBuffer()).slice(0, 3))
      expect(index % 2 === 0 ? red! - blue! : blue! - red!).toBeGreaterThan(150)
    })
  })
})
