/** Internal to react-native-filament. */
export interface VideoEncoderOptions {
  width: number
  height: number
  fps: number
  bitRate: number
  /** Absolute path of the MP4 file to write. */
  outputPath: string
}
