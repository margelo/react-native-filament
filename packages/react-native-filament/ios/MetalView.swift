import QuartzCore
import UIKit

final class MetalView: UIView {
  override class var layerClass: AnyClass { CAMetalLayer.self }

  var metalLayer: CAMetalLayer { layer as! CAMetalLayer }
  var onSurfaceChange: (() -> Void)?

  override func layoutSubviews() {
    super.layoutSubviews()
    onSurfaceChange?()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    onSurfaceChange?()
  }
}
