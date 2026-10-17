import type { HybridView, HybridViewMethods, HybridViewProps } from 'react-native-nitro-modules'
import type { SurfaceObserver } from '../types/SurfaceObserver'

export interface FilamentViewProps extends HybridViewProps {
  /**
   * Composite with the views behind it. Uses a `TextureView` on Android.
   * @default false
   */
  transparent?: boolean
}

export interface FilamentViewMethods extends HybridViewMethods {
  /**
   * Internal: a ViewTarget observes the view's surfaces through this.
   */
  setSurfaceObserver(observer: SurfaceObserver | undefined): void
}

export type FilamentView = HybridView<FilamentViewProps, FilamentViewMethods, { ios: 'swift'; android: 'kotlin' }>
