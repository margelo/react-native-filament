export interface TFilamentRecorder {
  width: number
  height: number
  fps: number

  isRecording: boolean
  startRecording(): Promise<void>
  stopRecording(): Promise<string>
}
