import { NitroModules } from 'react-native-nitro-modules'
import type { FilamentFactory } from './specs/FilamentFactory.nitro'

export const Filament = NitroModules.createHybridObject<FilamentFactory>('FilamentFactory')
