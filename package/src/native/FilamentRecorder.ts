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
}
