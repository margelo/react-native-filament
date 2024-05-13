//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentView.h"

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

void FilamentView::setChoreographer(std::shared_ptr<ChoreographerWrapper> choreographerWrapper) {
  _choreographer = choreographerWrapper->getChoreographer();
}

} // namespace margelo
