import CoreVideo
import Foundation

enum VideoEncoderError: LocalizedError {
  case unsupportedFormat(width: Int, height: Int)
  case writingFailed(Error?)
  case pixelBufferUnavailable(CVReturn)
  case unknownTarget
  case cancelled

  var errorDescription: String? {
    switch self {
    case let .unsupportedFormat(width, height):
      return "FilamentRecorderError: H.264 cannot encode \(width) x \(height) video on this device."
    case let .writingFailed(error):
      return "FilamentRecorderError: writing the video failed: \(error?.localizedDescription ?? "unknown error")."
    case let .pixelBufferUnavailable(status):
      return "FilamentRecorderError: no pixel buffer was available for the next frame (CVReturn \(status))."
    case .unknownTarget:
      return "FilamentRecorderError: a frame was submitted for a pixel buffer that was never acquired."
    case .cancelled:
      return "FilamentRecorderError: the recording was cancelled."
    }
  }
}
