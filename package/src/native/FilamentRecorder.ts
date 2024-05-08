import { Listener } from '../types/Listener'

export interface TFilamentRecorder {
  /**
   * The width of the video that is being recorded, in pixels.
   */
  width: number
  /**
   * The height of the video that is being recorded, in pixels.
   */
  height: number
  /**
   * The amount of frames per second this video will be recorded at.
   *
   * Filament can render faster than this, but frames will be queued to run at the given FPS,
   * assuming the timing (timestamp) is correct.
   */
  fps: number
  /**
   * The file that this Recorder is- or will be recording to.
   */
  outputFile: string

  /**
   * Whether this Recorder is currently recording or not.
   */
  isRecording: boolean

  /**
   * Starts the recording session.
   */
  startRecording(): Promise<void>
  /**
   * Stops the recording session and invalidates this recorder.
   */
  stopRecording(): Promise<string>

  /**
   * Appends the current Frame to the resulting video file.
   *
   * This might perform a copy of the current result stored in the SwapChain,
   * and will then encode the Frame using H.264 or H.265 to the video file.
   *
   * @throws Throws an error if the Recorder is not ready for more data. Use {@linkcode addOnReadyForMoreDataListener()} to
   * be notified when the Recorder is ready for more data to prevent this error.
   */
  renderFrame(timestamp: number): void

  /**
   * Adds a listener that will be called every time the Recorder is ready for more data.
   * When the Recorder is ready for more data, you can use {@linkcode renderFrame()} to render the next Frame.
   *
   * When your callback returns `false`, the render loop will stop.
   *
   * If you don't wait for this callback, you might risk dropping Frames as the recorder might not be ready
   * to consume more frames.
   *
   * @returns A Listener subscription that can be removed if no longer needed.
   * If the Recorder gets deleted, the listener also becomes invalid.
   */
  addOnReadyForMoreDataListener(callback: () => boolean): Listener
}
