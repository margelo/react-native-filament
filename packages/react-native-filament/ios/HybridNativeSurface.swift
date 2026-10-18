import NitroModules
import QuartzCore

final class HybridNativeSurface: HybridNativeSurfaceSpec_base, HybridNativeSurfaceSpec_protocol {
  let contentScale: Double
  let transparent: Bool
  let synchronousTeardown = false

  private let lock = NSLock()
  private var layer: CAMetalLayer?
  private var pixelSize: CGSize

  init(layer: CAMetalLayer, pixelSize: CGSize, contentScale: Double, transparent: Bool) {
    self.contentScale = contentScale
    self.layer = layer
    self.pixelSize = pixelSize
    self.transparent = transparent
  }

  var handle: UInt64 {
    lock.lock()
    defer { lock.unlock() }
    return layer.map { UInt64(UInt(bitPattern: Unmanaged.passUnretained($0).toOpaque())) } ?? 0
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
