import AVFoundation

struct VideoWriter {
  let url: URL
  let writer: AVAssetWriter
  let input: AVAssetWriterInput
  let adaptor: AVAssetWriterInputPixelBufferAdaptor

  init(options: VideoEncoderOptions) throws {
    let width = Int(options.width)
    let height = Int(options.height)
    url = URL(fileURLWithPath: options.outputPath)
    writer = try AVAssetWriter(outputURL: url, fileType: .mp4)
    input = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: options.bitRate,
        AVVideoExpectedSourceFrameRateKey: options.fps,
        AVVideoMaxKeyFrameIntervalKey: max(1, Int(options.fps)),
      ],
    ])
    input.expectsMediaDataInRealTime = false
    adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferMetalCompatibilityKey as String: true,
      kCVPixelBufferIOSurfacePropertiesKey as String: [String: Any](),
    ])
    guard writer.canAdd(input) else {
      throw VideoEncoderError.unsupportedFormat(width: width, height: height)
    }
    writer.add(input)
    guard writer.startWriting() else {
      throw VideoEncoderError.writingFailed(writer.error)
    }
    writer.startSession(atSourceTime: .zero)
  }

  func makePixelBuffer() throws -> CVPixelBuffer {
    guard let pool = adaptor.pixelBufferPool else {
      throw VideoEncoderError.writingFailed(writer.error)
    }
    var buffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
    guard status == kCVReturnSuccess, let buffer else {
      throw VideoEncoderError.pixelBufferUnavailable(status)
    }
    return buffer
  }
}
