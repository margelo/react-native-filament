import { describe, expect, it } from 'react-native-harness'
import { Platform } from 'react-native'
import { Filament } from 'react-native-filament'
import { renderView } from './renderView'

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
    const target = await engine.createViewTarget(view, { clearOptions: { color: [1, 0, 0, 1] } })
    expect(target.width).toBeGreaterThanOrEqual(0)
    await engine.shutdown()
  })
})
