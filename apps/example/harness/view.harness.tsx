import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Filament, runOnRenderThread, type Engine, type ViewTarget } from 'react-native-filament'
import { renderView } from './renderView'

describe('View', () => {
  let engine: Engine
  let target: ViewTarget

  beforeEach(async () => {
    engine = await Filament.createEngine({})
    target = await engine.createViewTarget(await renderView(), {})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('exposes the defaults and applies option changes', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const view = target.view
      const defaults = [view.antiAliasing, view.dithering, view.postProcessing, view.shadowing, view.shadowType, view.screenSpaceRefraction]
      view.antiAliasing = 'none'
      view.dithering = 'none'
      view.postProcessing = false
      view.shadowing = false
      view.shadowType = 'pcss'
      view.screenSpaceRefraction = false
      view.setAmbientOcclusionOptions({ enabled: true, type: 'gtao', quality: 'high' })
      view.setBloomOptions({ enabled: true, blendMode: 'interpolate', quality: 'medium' })
      view.setTemporalAntiAliasingOptions({ enabled: true, upscaling: 1.5, jitterPattern: 'halton-23-x8', boxClipping: 'clamp' })
      view.setDynamicResolutionOptions({ enabled: true, minScale: [0.5, 0.5], quality: 'ultra' })
      return { defaults, changed: [view.antiAliasing, view.dithering, view.postProcessing, view.shadowing, view.shadowType, view.screenSpaceRefraction] }
    })
    expect(read.defaults).toEqual(['fxaa', 'temporal', true, true, 'pcf', true])
    expect(read.changed).toEqual(['none', 'none', false, false, 'pcss', false])
  })

  it('notifies first-frame listeners once, and right away after the first frame', async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      target.setScene(engine.createScene())
    })
    let calls = 0
    await new Promise<void>((resolve) => {
      target.addOnFirstFrameListener(() => {
        calls++
        resolve()
      })
    })
    const late = await new Promise<boolean>((resolve) => {
      target.addOnFirstFrameListener(() => resolve(true))
    })
    expect(calls).toBe(1)
    expect(late).toBe(true)
  })

  it('projects world positions to points from the top-left corner', async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      const camera = engine.createCamera()
      camera.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
      camera.setProjection(60, 1, 0.1, 100)
      target.setScene(engine.createScene())
      target.setCamera(camera)
    })
    await new Promise<void>((resolve) => target.addOnFirstFrameListener(resolve))
    const [center, above] = await runOnRenderThread(engine, () => {
      'worklet'
      return [target.view.projectWorldToScreen([0, 0, 0]), target.view.projectWorldToScreen([0, 1, 0])]
    })
    expect(center[0]).toBeCloseTo(100, 0)
    expect(center[1]).toBeCloseTo(100, 0)
    expect(above[1]).toBeLessThan(center[1])
  })
})
