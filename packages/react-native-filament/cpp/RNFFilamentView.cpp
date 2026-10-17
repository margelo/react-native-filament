//
// Created by Marc Rousavy on 20.02.24.
//

#include "RNFFilamentView.h"

namespace margelo {

FilamentView::~FilamentView() {
  if (_choreographer) {
    // When the view gets destroyed we must stop the linked choreographer
    Logger::log(TAG, "The FilamentView is being destroyed, stop the linked choreographer.");
    _choreographer->stop();
  }
}

void FilamentView::loadHybridMethods() {
  registerHybridMethod("getSurfaceProvider", &FilamentView::getSurfaceProvider, this);
  registerHybridMethod("setChoreographer", &FilamentView::setChoreographer, this);
}

void FilamentView::setChoreographer(std::optional<std::shared_ptr<ChoreographerWrapper>> choreographerWrapperOrNull) {
  if (!choreographerWrapperOrNull.has_value()) {
    Logger::log(TAG, "Removing reference to choreographer.");
    _choreographer = nullptr;
    _onSurfaceDestroyedListener = nullptr;
    return;
  }

  std::shared_ptr<ChoreographerWrapper> choreographerWrapper = choreographerWrapperOrNull.value();
  auto choreographer = choreographerWrapper->getChoreographer();
  _choreographer = choreographer;

  // Note: This callback is mostly needed for android, as the FilamentView is held in a Java object and might gets
  // destroyed long after the view has been actually removed
  _onSurfaceDestroyedListener = getSurfaceProvider()->addOnSurfaceChangedListener({
      .onSurfaceCreated = std::nullopt,
      .onSurfaceSizeChanged = std::nullopt,
      .onSurfaceDestroyed =
          [choreographer](std::shared_ptr<Surface> surface) {
            Logger::log(TAG, "Surface destroyed, stopping choreographer.");
            choreographer->stop();
          },
  });
}

} // namespace margelo
