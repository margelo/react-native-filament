//
// Created by Marc Rousavy on 20.02.24.
//

#include "SurfaceProvider.h"

namespace margelo {

void SurfaceProvider::loadHybridMethods() {
    registerHybridMethod("getSurface", &SurfaceProvider::getSurfaceOrNull, this);
}

Listener SurfaceProvider::addOnSurfaceChangedListener(margelo::SurfaceProvider::Callback callback) {
    std::unique_lock lock(_mutex);

    _callbacks.push_back(std::move(callback));
    size_t index = _callbacks.size();

    return Listener([weakThis = this, index]() {
        if (weakThis != nullptr) {
            std::unique_lock lock(weakThis->_mutex);
            weakThis->_callbacks.erase(weakThis->_callbacks.begin() + index);
        }
    });
}

void SurfaceProvider::onSurfaceCreated(std::shared_ptr<Surface> surface) {
  std::unique_lock lock(_mutex);
  for (const auto& listener : _callbacks) {
      listener.onSurfaceCreated(surface);
  }
}

void SurfaceProvider::onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height) {
  std::unique_lock lock(_mutex);
    for (const auto& listener : _callbacks) {
        listener.onSurfaceSizeChanged(surface, width, height);
    }
}

void SurfaceProvider::onSurfaceDestroyed(std::shared_ptr<Surface> surface) {
  std::unique_lock lock(_mutex);
    for (const auto& listener : _callbacks) {
        listener.onSurfaceDestroyed(surface);
    }
}

} // namespace margelo
