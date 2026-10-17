import React from 'react'
import { describe, expect, it, render } from 'react-native-harness'
import { Platform } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, type FilamentView } from 'react-native-filament'

function renderView(): Promise<FilamentView> {
  return new Promise((resolve) => {
    render(<NativeFilamentView style={{ width: 200, height: 200 }} hybridRef={callback(resolve)} />)
  })
}

describe('Engine', () => {
  it('creates an engine with the preferred backend', async () => {
    const engine = await Filament.createEngine({})
    expect(engine.backend).toBe(Filament.supportedBackends[0])
    await engine.shutdown()
  })

  it('rejects a backend this platform does not support', async () => {
    const backend = Platform.OS === 'ios' ? 'vulkan' : 'metal'
    await expect(Filament.createEngine({ backend })).rejects.toThrow(`The backend "${backend}" is not supported on this device.`)
  })

  it('returns the same shutdown Promise to every caller', async () => {
    const engine = await Filament.createEngine({})
    const first = engine.shutdown()
    const second = engine.shutdown()
    await Promise.all([first, second])
  })

  it('creates a view target that follows the view surface', async () => {
    const engine = await Filament.createEngine({})
    const view = await renderView()
    const target = await engine.createViewTarget(view, { clearColor: [1, 0, 0, 1] })
    expect(target.width).toBeGreaterThanOrEqual(0)
    await engine.shutdown()
  })
})
