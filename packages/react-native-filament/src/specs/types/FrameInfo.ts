export interface FrameInfo {
  /** Vsync time of this frame, in nanoseconds of the platform's monotonic clock. */
  timestampNs: number
  /** Seconds since the previous rendered frame; 0 on the first frame and after rendering resumes. */
  deltaSeconds: number
  /** Sum of `deltaSeconds` over all frames so far; paused time is not counted. */
  elapsedSeconds: number
  /** Number of frames rendered before this one. */
  frameIndex: number
}
