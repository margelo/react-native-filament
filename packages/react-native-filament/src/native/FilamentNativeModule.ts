import { TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  install(): boolean
}

export const FilamentNativeModule = TurboModuleRegistry.getEnforcing<Spec>('FilamentModule')
