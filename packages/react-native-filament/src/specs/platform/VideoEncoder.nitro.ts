import type { HybridObject, UInt64 } from 'react-native-nitro-modules'

/**
 * An H.264 MP4 writer that Filament renders into: `AVAssetWriter` on iOS, an asynchronous
 * `MediaCodec` and `MediaMuxer` on Android. Its methods are called from one thread at a time; its
 * listeners fire on any thread. Internal to react-native-filament.
 */
export interface VideoEncoder extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * The native target to render the next frame into: a `CVPixelBuffer` on iOS that stays valid
   * until it is submitted, the encoder's input `ANativeWindow` on Android.
   */
  acquireFrame(): UInt64
  /** Encodes the completed frame rendered into `target`, shown at `frameIndex / fps` seconds. */
  submitFrame(target: UInt64, frameIndex: number): void
  /**
   * `onFrameAccepted` fires once per submitted frame when the encoder has taken it, `onError` when
   * writing fails.
   */
  setListeners(onFrameAccepted: () => void, onError: (error: Error) => void): void
  /** Ends the stream after every submitted frame and resolves with the file's `file://` URI. */
  finish(): Promise<string>
  /** Stops writing, releases every acquired target and deletes the file. */
  cancel(): void
}
