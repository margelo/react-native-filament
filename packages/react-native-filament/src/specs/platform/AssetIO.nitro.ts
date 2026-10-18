import type { HybridObject } from 'react-native-nitro-modules'

/**
 * Reads asset bytes natively: memory-maps files and bundled assets, downloads URLs to a file first.
 * Internal to react-native-filament.
 */
export interface AssetIO extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  read(uri: string): Promise<ArrayBuffer>
  /** Absolute path of a directory the app can write temporary files to. */
  readonly temporaryDirectory: string
}
