import NitroModules
import QuartzCore

final class HybridNativeSurface: HybridNativeSurfaceSpec_base, HybridNativeSurfaceSpec_protocol {
  let handle: UInt64
  let transparent: Bool
  let synchronousTeardown = false

  private let lock = NSLock()
  private var layer: CAMetalLayer?
  private var pixelSize: CGSize

  init(layer: CAMetalLayer, pixelSize: CGSize, transparent: Bool) {
    self.handle = UInt64(UInt(bitPattern: Unmanaged.passUnretained(layer).toOpaque()))
    self.layer = layer
    self.pixelSize = pixelSize
    self.transparent = transparent
  }

  var width: Double {
    lock.lock()
    defer { lock.unlock() }
    return Double(pixelSize.width)
  }

  var height: Double {
    lock.lock()
    defer { lock.unlock() }
    return Double(pixelSize.height)
  }

  func update(pixelSize: CGSize) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    guard self.pixelSize != pixelSize else { return false }
    self.pixelSize = pixelSize
    return true
  }

  func release() throws {
    lock.lock()
    defer { lock.unlock() }
    layer = nil
  }
}
