import Foundation
import NitroModules

final class HybridVideoEncoderFactory: HybridVideoEncoderFactorySpec_base, HybridVideoEncoderFactorySpec_protocol {
  func createEncoder(options: VideoEncoderOptions) throws -> Promise<any HybridVideoEncoderSpec> {
    let queue = DispatchQueue(label: "com.margelo.filament.video-encoder")
    return Promise.parallel(queue) {
      let writer = try VideoWriter(options: options)
      return HybridVideoEncoder(writer: writer, fps: options.fps, queue: queue)
    }
  }
}
