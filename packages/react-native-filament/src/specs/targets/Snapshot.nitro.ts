import type { HybridObject } from 'react-native-nitro-modules'

/** One rendered frame of a `ViewTarget`, kept natively until read. */
export interface Snapshot extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Width in pixels. @thread any */
  readonly width: number
  /** Height in pixels. @thread any */
  readonly height: number
  /**
   * The pixels as RGBA bytes, top row first. Copies them.
   * @thread any
   */
  toArrayBuffer(): ArrayBuffer
  /**
   * Encodes the frame as PNG on a worker thread, writes it to a new file in the app's temporary
   * directory, and resolves with its `file://` URI.
   * @thread any
   */
  saveToTemporaryFile(): Promise<string>
}
