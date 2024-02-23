//
// Created by Marc Rousavy on 23.02.24.
//

#include "Choreographer.h"

namespace margelo {

void Choreographer::loadHybridMethods() {
  registerHybridMethod("addOnFrameListener", &Choreographer::addOnFrameListener, this);
  registerHybridMethod("start", &Choreographer::start, this);
  registerHybridMethod("stop", &Choreographer::stop, this);
}

std::shared_ptr<Listener> Choreographer::addOnFrameListener(Choreographer::OnFrameCallback onFrameCallback) {
  _callbacks.push_back(std::move(onFrameCallback));
  return std::make_shared<Listener>([]() {
    // TODO: Find a safe way to remove this listener from the vector.
  });
}

void Choreographer::onFrame(double timestamp) {
  for (const auto& callback : _callbacks) {
    callback(timestamp);
  }
}

} // namespace margelo