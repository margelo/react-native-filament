//
// Created by Marc Rousavy on 20.02.24.
//

#include "SurfaceProvider.h"
#include "Logger.h"

namespace margelo {

void SurfaceProvider::loadHybridMethods() {
  registerHybridMethod("getSurface", &SurfaceProvider::getSurface, this);
  registerHybridMethod("addOnSurfaceCreatedListener", &SurfaceProvider::addOnSurfaceCreatedListener, this);
  registerHybridMethod("addOnSurfaceDestroyedListener", &SurfaceProvider::addOnSurfaceDestroyedListener, this);
}

std::shared_ptr<Listener> SurfaceProvider::addOnSurfaceChangedListener(SurfaceProvider::Callbacks&& callback) {
  std::unique_lock lock(_mutex);

  return _listeners->add(std::move(callback));
}

// TODO: note, we are storing again a JSI function here. Potentially we need to make sure this gets destroyed on the same thread it was
//       created on, so we need to use the Runtime Listener here as well.
std::shared_ptr<Listener> SurfaceProvider::addOnSurfaceCreatedListener(SurfaceProvider::TOnCreate callback) {
  Logger::log(TAG, "Adding \"surface created\" listener");
  std::unique_lock lock(_mutex);

  return _listeners->add({
      .onSurfaceCreated = callback,
      .onSurfaceSizeChanged = std::nullopt,
      .onSurfaceDestroyed = std::nullopt,
  });
}
std::shared_ptr<Listener> SurfaceProvider::addOnSurfaceDestroyedListener(SurfaceProvider::TOnDestroy callback) {
  Logger::log(TAG, "Adding \"surface destroyed\" listener");
  std::unique_lock lock(_mutex);

  return _listeners->add({
      .onSurfaceCreated = std::nullopt,
      .onSurfaceSizeChanged = std::nullopt,
      .onSurfaceDestroyed = callback,
  });
}

void SurfaceProvider::onSurfaceCreated(std::shared_ptr<Surface> surface) {
  Logger::log(TAG, "Surface created!");
  std::unique_lock lock(_mutex);
  _listeners->forEach([=](const Callbacks& callbacks) {
    if (callbacks.onSurfaceCreated.has_value()) {
      TOnCreate callback = callbacks.onSurfaceCreated.value();
      callback(surface);
    }
  });
}

void SurfaceProvider::onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height) {
  Logger::log(TAG, "Surface resized to %i x %i!", width, height);
  std::unique_lock lock(_mutex);
  _listeners->forEach([=](const Callbacks& callbacks) {
    if (callbacks.onSurfaceSizeChanged.has_value()) {
      TOnResize callback = callbacks.onSurfaceSizeChanged.value();
      callback(surface, width, height);
    }
  });
}

void SurfaceProvider::onSurfaceDestroyed(std::shared_ptr<Surface> surface) {
  Logger::log(TAG, "Surface destroyed!");
  std::unique_lock lock(_mutex);
  _listeners->forEach([=](const Callbacks& callbacks) {
    if (callbacks.onSurfaceDestroyed.has_value()) {
      TOnDestroy callback = callbacks.onSurfaceDestroyed.value();
      callback(surface);
    }
  });
}
std::optional<std::shared_ptr<Surface>> SurfaceProvider::getSurface() {
  std::shared_ptr<Surface> surface = getSurfaceOrNull();
  if (surface == nullptr) {
    return std::nullopt;
  }
  return std::optional<std::shared_ptr<Surface>>(surface);
}

} // namespace margelo
