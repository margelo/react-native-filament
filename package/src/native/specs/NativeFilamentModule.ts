import { TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  /**
   * Installs the global.FilamentProxy into the runtime.
   *
   * @returns true if the module was installed, false if it failed.
   */
  install(): boolean
}

export default TurboModuleRegistry.getEnforcing<Spec>('FilamentModule')
