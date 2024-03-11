//
// Created by Marc Rousavy on 23.02.24.
//

#include "Choreographer.h"
#include "ListenerManager.h"

namespace margelo {

std::shared_ptr<Listener> Choreographer::addOnFrameListener(Choreographer::OnFrameCallback onFrameCallback) {
  return _listeners->add(std::move(onFrameCallback));
}

void Choreographer::onFrame(double timestamp) {
  for (const auto& listener : _listeners->getListeners()) {
    listener(timestamp);
  }
}

} // namespace margelo
