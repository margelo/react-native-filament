import type { NativeSurface } from '../platform/NativeSurface.nitro'

export interface SurfaceObserver {
  onCreated: (surface: NativeSurface) => void
  onResized: (surface: NativeSurface) => void
  onDestroyed: (surface: NativeSurface) => void
}
