import AVFoundation
import NitroModules

final class HybridVideoEncoder: HybridVideoEncoderSpec_base, HybridVideoEncoderSpec_protocol {
  private let writer: VideoWriter
  private let fps: Double
  private let queue: DispatchQueue
  private var acquired: [UInt64: CVPixelBuffer] = [:]
  private var pending: [EncodedFrame] = []
  private var onFrameAccepted: (() -> Void)?
  private var onError: ((Error) -> Void)?
  private var finishing: Promise<String>?
  private var readyObservation: NSKeyValueObservation?

  init(writer: VideoWriter, fps: Double, queue: DispatchQueue) {
    self.writer = writer
    self.fps = fps
    self.queue = queue
    super.init()
    readyObservation = writer.input.observe(\.isReadyForMoreMediaData, options: [.new]) { [weak self] _, _ in
      guard let self else { return }
      self.queue.async { self.appendReadyFrames() }
    }
  }

  func acquireFrame() throws -> UInt64 {
    let buffer = try writer.makePixelBuffer()
    acquired[buffer.handle] = buffer
    return buffer.handle
  }

  func submitFrame(target: UInt64, frameIndex: Double) throws {
    guard let buffer = acquired.removeValue(forKey: target) else {
      throw VideoEncoderError.unknownTarget
    }
    let frame = EncodedFrame(buffer: buffer, time: CMTime(frameIndex: frameIndex, fps: fps))
    queue.async {
      self.pending.append(frame)
      self.appendReadyFrames()
    }
  }

  func setListeners(onFrameAccepted: @escaping () -> Void, onError: @escaping (Error) -> Void) throws {
    queue.async {
      self.onFrameAccepted = onFrameAccepted
      self.onError = onError
    }
  }

  func finish() throws -> Promise<String> {
    let promise = Promise<String>()
    queue.async {
      self.finishing = promise
      self.finishIfDrained()
    }
    return promise
  }

  func cancel() throws {
    acquired.removeAll()
    queue.async {
      self.pending.removeAll()
      self.finishing?.reject(withError: VideoEncoderError.cancelled)
      self.finishing = nil
      if self.writer.writer.status == .writing {
        self.writer.writer.cancelWriting()
      }
      try? FileManager.default.removeItem(at: self.writer.url)
    }
  }

  private func appendReadyFrames() {
    while writer.input.isReadyForMoreMediaData, let frame = pending.first {
      pending.removeFirst()
      guard writer.adaptor.append(frame.buffer, withPresentationTime: frame.time) else {
        fail(VideoEncoderError.writingFailed(writer.writer.error))
        return
      }
      onFrameAccepted?()
    }
    finishIfDrained()
  }

  private func finishIfDrained() {
    guard let promise = finishing, pending.isEmpty else { return }
    finishing = nil
    writer.input.markAsFinished()
    writer.writer.finishWriting { [writer] in
      if writer.writer.status == .completed {
        promise.resolve(withResult: writer.url.absoluteString)
      } else {
        promise.reject(withError: VideoEncoderError.writingFailed(writer.writer.error))
      }
    }
  }

  private func fail(_ error: Error) {
    pending.removeAll()
    onError?(error)
    finishing?.reject(withError: error)
    finishing = nil
  }
}
