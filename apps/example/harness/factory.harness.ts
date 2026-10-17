import { describe, expect, it } from 'react-native-harness'
import { Platform } from 'react-native'
import { Filament } from 'react-native-filament'
import pin from 'react-native-filament/filament.json'

describe('FilamentFactory', () => {
  it('reports the version of the linked Filament binaries', () => {
    expect(Filament.filamentVersion).toBe(pin.version)
  })

  it('lists the backends of this platform, preferred first', () => {
    const backends = Filament.supportedBackends
    if (Platform.OS === 'ios') {
      expect(backends).toEqual(['metal'])
    } else {
      expect(backends[0]).toBe('opengl')
      expect(backends.every((backend) => backend === 'opengl' || backend === 'vulkan')).toBe(true)
    }
  })
})
