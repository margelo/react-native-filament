import CoreVideo

extension CVPixelBuffer {
  /** The buffer's address, for Filament's `CONFIG_APPLE_CVPIXELBUFFER` swap chains. */
  var handle: UInt64 {
    UInt64(UInt(bitPattern: Unmanaged.passUnretained(self).toOpaque()))
  }
}
