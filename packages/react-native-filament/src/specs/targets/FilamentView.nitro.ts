import type { HybridView, HybridViewMethods, HybridViewProps } from 'react-native-nitro-modules'
import type { SurfaceObserver } from '../types/SurfaceObserver'

/** Props of the native view, exported as `NativeFilamentViewProps`. */
export interface FilamentViewProps extends HybridViewProps {
  /**
   * Composite with the views behind it. Uses a `TextureView` on Android.
   * @default false
   */
  transparent?: boolean
}

/** Internal methods of the native view, used by `ViewTarget`. */
export interface FilamentViewMethods extends HybridViewMethods {
  /**
   * Internal: a ViewTarget observes the view's surfaces through this.
   */
  setSurfaceObserver(observer: SurfaceObserver | undefined): void
}

/**
 * The native view Filament renders into. Pass it to `Engine.createViewTarget()`.
 */
export type FilamentView = HybridView<FilamentViewProps, FilamentViewMethods, { ios: 'swift'; android: 'kotlin' }>
