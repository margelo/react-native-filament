import NitroModules
import UIKit

final class HybridFilamentView: HybridFilamentViewSpec_base, HybridFilamentViewSpec_protocol {
  let view = MetalView()

  private var observer: SurfaceObserver?
  private var surface: HybridNativeSurface?

  var transparent: Bool? {
    didSet {
      guard oldValue != transparent else { return }
      applyTransparency()
      replaceSurface()
    }
  }

  override init() {
    super.init()
    applyTransparency()
    view.onSurfaceChange = { [weak self] in self?.updateSurface() }
  }

  func setSurfaceObserver(observer: SurfaceObserver?) throws {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.surface = nil
      self.observer = observer
      self.updateSurface()
    }
  }

  private var isTransparent: Bool { transparent ?? false }

  private var pixelSize: CGSize {
    let scale = view.window?.screen.scale ?? UIScreen.main.scale
    return CGSize(width: view.bounds.width * scale, height: view.bounds.height * scale)
  }

  private func applyTransparency() {
    view.isOpaque = !isTransparent
    view.metalLayer.isOpaque = !isTransparent
    view.backgroundColor = isTransparent ? .clear : .black
  }

  private func replaceSurface() {
    guard let observer, let surface else { return }
    self.surface = nil
    observer.onDestroyed(surface)
    updateSurface()
  }

  private func updateSurface() {
    let size = pixelSize
    view.metalLayer.drawableSize = size
    guard let observer else { return }
    let isVisible = view.window != nil && size.width > 0 && size.height > 0
    if isVisible, let surface {
      if surface.update(pixelSize: size) {
        observer.onResized(surface)
      }
    } else if isVisible {
      let created = HybridNativeSurface(layer: view.metalLayer, pixelSize: size, transparent: isTransparent)
      surface = created
      observer.onCreated(created)
    } else if let surface {
      self.surface = nil
      observer.onDestroyed(surface)
    }
  }
}
