import type { HybridObject, UInt64 } from 'react-native-nitro-modules'

/**
 * One OS surface handed to Filament: an `ANativeWindow` on Android, a `CAMetalLayer` on iOS.
 * Internal to react-native-filament.
 */
export interface NativeSurface extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly handle: UInt64
  readonly width: number
  readonly height: number
  /** Composites with the views behind it. */
  readonly transparent: boolean
  /** The OS destroys this surface once its destroyed callback returns, so teardown must finish first. */
  readonly synchronousTeardown: boolean
  release(): void
}
