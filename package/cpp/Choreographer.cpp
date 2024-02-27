//
// Created by Marc Rousavy on 23.02.24.
//

#include "Choreographer.h"
#include "ListenerManager.h"

namespace margelo {

void Choreographer::loadHybridMethods() {
  registerHybridMethod("addOnFrameListener", &Choreographer::addOnFrameListener, this);
  registerHybridMethod("start", &Choreographer::start, this);
  registerHybridMethod("stop", &Choreographer::stop, this);
}

std::shared_ptr<Listener> Choreographer::addOnFrameListener(Choreographer::OnFrameCallback onFrameCallback) {
  auto listener = _listeners.add(std::move(onFrameCallback));
  return std::make_shared<Listener>(std::move(listener));
}

void Choreographer::onFrame(double timestamp) {
  for (const auto& listener : _listeners.getListeners()) {
    listener(timestamp);
  }
}

} // namespace margelo