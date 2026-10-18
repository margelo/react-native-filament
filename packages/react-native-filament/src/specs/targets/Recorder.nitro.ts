import type { HybridObject } from 'react-native-nitro-modules'
import type { ClearOptions } from '../types/ClearOptions'
import type { Camera } from '../scene/Camera.nitro'
import type { Scene } from '../scene/Scene.nitro'
import type { View } from '../scene/View.nitro'

/**
 * Renders a scene offscreen into an H.264 MP4 file, as fast as the encoder accepts frames. Create
 * it on an Engine dedicated to recording: while a recording runs, that Engine renders only the
 * recorder's frames and its view targets pause.
 */
export interface Recorder extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly width: number
  /** @thread any */
  readonly height: number
  /** @thread any */
  readonly fps: number
  /** @thread render */
  readonly view: View
  /** @thread render */
  setScene(scene: Scene): void
  /** @thread render */
  setCamera(camera: Camera): void
  /** @thread render */
  setClearOptions(options: ClearOptions): void
  /**
   * Renders `frameCount` frames and resolves with the `file://` URI of the finished MP4 in the
   * temporary directory. Before each frame the Engine runs its bindings, frame listeners and
   * animation players on a fixed clock: frame `i` has `elapsedSeconds = i / fps` and
   * `deltaSeconds = 1 / fps` (0 for the first frame). Rejects while another recording runs, and
   * with `FilamentDisposedError` when the recorder or its Engine is disposed first.
   * @thread any
   */
  record(frameCount: number): Promise<string>
}
