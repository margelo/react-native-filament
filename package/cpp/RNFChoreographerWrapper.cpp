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

void ChoreographerWrapper::loadHybridMethods() {
  PointerHolder::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridMethod("start", &ChoreographerWrapper::start);
    proto.registerHybridMethod("stop", &ChoreographerWrapper::stop);
    proto.registerHybridMethod("addFrameCallbackListener", &ChoreographerWrapper::addFrameCallbackListener);
    // TODO: overwrite mechanism doens't exist yet i believe
    proto.registerHybridMethod("release", &ChoreographerWrapper::release);
  });
}

void ChoreographerWrapper::start() {
  std::unique_lock lock(_mutex);

  pointee()->start();
}

void ChoreographerWrapper::stop() {
  std::unique_lock lock(_mutex);

  pointee()->stop();
}

std::shared_ptr<Listener> ChoreographerWrapper::addFrameCallbackListener(RenderCallback onFrameCallback) {
  std::unique_lock lock(_mutex);

  Logger::log(TAG, "Adding frame callback listener");

  std::weak_ptr<ChoreographerWrapper> weakThis = shared<ChoreographerWrapper>();
  return pointee()->addOnFrameListener([weakThis, onFrameCallback](double timestamp) {
    auto sharedThis = weakThis.lock();
    if (sharedThis) {
      FrameInfo frameInfo = sharedThis->createFrameInfo(timestamp);
      onFrameCallback(frameInfo);
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
  return {
      {"timestamp", timestamp},
      {"passedSeconds", passedSeconds},
      {"startTime", _startTime},
      {"timeSinceLastFrame", timeSinceLastFrame},
  };
}

void ChoreographerWrapper::stopAndRemoveListeners() {
  // Its possible that the pointer was already released manually by the user
  if (!getIsValid()) {
    Logger::log(TAG, "stopAndRemoveListeners() called but Choreographer is invalid already!");
    return;
  }

  Logger::log(TAG, "Stopping choreographer and removing listeners...");
  pointee()->stop();
  // Clear all listeners now - that will cause the listeners function destructors to be called
  // When onRuntimeDestroyed gets called we still have time to stopAndRemoveListeners our jsi functions (RenderCallback):
  pointee()->removeAllListeners();
}

void ChoreographerWrapper::release() {
  std::unique_lock lock(_mutex);
  stopAndRemoveListeners();
  PointerHolder::release();
}

// TODO: nitro is this still needed? I don't think so
//void ChoreographerWrapper::onRuntimeDestroyed(jsi::Runtime*) {
//  std::unique_lock lock(_mutex);
//  Logger::log(TAG, "Runtime destroyed...");
//  stopAndRemoveListeners();
//}

std::shared_ptr<Choreographer> ChoreographerWrapper::getChoreographer() {
  if (getIsValid()) {
    return pointee();
  }
  return nullptr;
}

} // namespace margelo
