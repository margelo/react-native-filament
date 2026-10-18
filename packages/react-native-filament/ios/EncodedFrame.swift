import CoreMedia
import CoreVideo

struct EncodedFrame {
  let buffer: CVPixelBuffer
  let time: CMTime
}
