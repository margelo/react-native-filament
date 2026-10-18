import { NitroModules } from 'react-native-nitro-modules'
import type { FilamentFactory } from './specs/FilamentFactory.nitro'

/**
 * The root of the native API: the linked Filament version, the backends this device supports, and
 * `createEngine()`.
 */
export const Filament = NitroModules.createHybridObject<FilamentFactory>('FilamentFactory')
