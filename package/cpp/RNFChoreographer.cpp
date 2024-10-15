//
// Created by Marc Rousavy on 23.02.24.
//

#include "RNFLogger.h"
#include "RNFChoreographer.h"
#include "RNFListenerManager.h"

namespace margelo {

std::shared_ptr<Listener> Choreographer::addOnFrameListener(Choreographer::OnFrameCallback onFrameCallback) {
  return _listeners->add(std::move(onFrameCallback));
}

void Choreographer::onFrame(double timestamp) {
  _listeners->forEach([=](const OnFrameCallback& callback) { callback(timestamp); });
}

void Choreographer::removeAllListeners() {
  Logger::log(TAG, "Removing all listeners");
  // Simply create a new ListenerManager, so the memory of the old one gets freed.
  _listeners = ListenerManager<OnFrameCallback>::create();
}

} // namespace margelo
