//
// Created by Marc Rousavy on 20.02.24.
//

#include "SurfaceProvider.h"
#include "Logger.h"

namespace margelo {

void SurfaceProvider::loadHybridMethods() {
  registerHybridMethod("getSurface", &SurfaceProvider::getSurfaceOrNull, this);
}

Listener SurfaceProvider::addOnSurfaceChangedListener(SurfaceProvider::Callback callback) {
  std::unique_lock lock(_mutex);

  return _listeners.add(std::move(callback));
}

void SurfaceProvider::onSurfaceCreated(std::shared_ptr<Surface> surface) {
  Logger::log(TAG, "Surface created!");
  std::unique_lock lock(_mutex);
  for (const auto& listener : _listeners.getListeners()) {
    listener.onSurfaceCreated(surface);
  }
}

void SurfaceProvider::onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height) {
  Logger::log(TAG, "Surface resized to %i x %i!", width, height);
  std::unique_lock lock(_mutex);
  for (const auto& listener : _listeners.getListeners()) {
    listener.onSurfaceSizeChanged(surface, width, height);
  }
}

void SurfaceProvider::onSurfaceDestroyed(std::shared_ptr<Surface> surface) {
  Logger::log(TAG, "Surface destroyed!");
  std::unique_lock lock(_mutex);
  for (const auto& listener : _listeners.getListeners()) {
    listener.onSurfaceDestroyed(surface);
  }
}

} // namespace margelo
