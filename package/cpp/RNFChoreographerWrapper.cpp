//
// Created by Hanno Gödecke on 02.05.24.
//

#include "RNFChoreographerWrapper.h"

namespace margelo {

// Will be called on automatic removal (can happen when the runtime gets destroyed, and onRuntimeDestroyed would be called later)
ChoreographerWrapper::~ChoreographerWrapper() {
  std::unique_lock lock(_mutex);
  stopAndRemoveListeners();
}

void ChoreographerWrapper::start() {
  std::unique_lock lock(_mutex);

  pointee()->start();
}

void ChoreographerWrapper::stop() {
  std::unique_lock lock(_mutex);

  pointee()->stop();
}

std::shared_ptr<HybridListenerSpec> ChoreographerWrapper::addFrameCallbackListener(const std::function<void(const FrameInfo& /* frameInfo */)>& callback) {
  std::unique_lock lock(_mutex);

  margelo::Logger::log(HybridChoreographerSpec::TAG, "Adding frame callback listener");

  std::weak_ptr<ChoreographerWrapper> weakThis = shared<ChoreographerWrapper>();
  return pointee()->addOnFrameListener([weakThis, callback](double timestamp) {
    auto sharedThis = weakThis.lock();
    if (sharedThis) {
      FrameInfo frameInfo = sharedThis->createFrameInfo(timestamp);
      callback(frameInfo);
    }
  });
}

FrameInfo ChoreographerWrapper::createFrameInfo(double timestamp) {
  std::unique_lock lock(_mutex);

  if (_startTime == 0) {
    [[unlikely]];
    _startTime = timestamp;
  }

  double passedSeconds = (timestamp - _startTime) / 1e9;
  double timeSinceLastFrame = (timestamp - _lastFrameTime) / 1e9;
  _lastFrameTime = timestamp;
  return FrameInfo(timestamp, _startTime, passedSeconds, timeSinceLastFrame);
}

void ChoreographerWrapper::stopAndRemoveListeners() {
  // Its possible that the pointer was already released manually by the user
  if (!HybridPointerHolder::getIsValid()) {
    margelo::Logger::log(HybridChoreographerSpec::TAG, "stopAndRemoveListeners() called but Choreographer is invalid already!");
    return;
  }

    margelo::Logger::log(HybridChoreographerSpec::TAG, "Stopping choreographer and removing listeners...");
  pointee()->stop();
  // Clear all listeners now - that will cause the listeners function destructors to be called
  // When onRuntimeDestroyed gets called we still have time to stopAndRemoveListeners our jsi functions (RenderCallback):
  pointee()->removeAllListeners();
}

// TODO: tries to overwrite release from PointerHolder
//void ChoreographerWrapper::release() {
//  std::unique_lock lock(_mutex);
//  stopAndRemoveListeners();
//  PointerHolder::release();
//}

void ChoreographerWrapper::onRuntimeDestroyed(jsi::Runtime*) {
  std::unique_lock lock(_mutex);
  margelo::Logger::log(HybridChoreographerSpec::TAG, "Runtime destroyed...");
  stopAndRemoveListeners();
}

std::shared_ptr<Choreographer> ChoreographerWrapper::getChoreographer() {
  if (HybridPointerHolder::getIsValid()) {
    return pointee();
  }
  return nullptr;
}

} // namespace margelo
