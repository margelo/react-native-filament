//
// Created by Hanno Gödecke on 02.05.24.
//

#include "RNFChoreographerWrapper.h"

namespace margelo {

void ChoreographerWrapper::loadHybridMethods() {
  registerHybridMethod("start", &ChoreographerWrapper::start, this);
  registerHybridMethod("stop", &ChoreographerWrapper::stop, this);
  registerHybridMethod("addFrameCallbackListener", &ChoreographerWrapper::addFrameCallbackListener, this);
  registerHybridMethod("release", &ChoreographerWrapper::release, this, true);
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

void ChoreographerWrapper::cleanup() {
  Logger::log(TAG, "Cleanup ChoreographerWrapper");

  // Its possible that the pointer was already released manually by the user
  if (getIsValid()) {
    pointee()->stop();
    // Clear all listeners now - that will cause the listeners function destructors to be called
    // When onRuntimeDestroyed gets called we still have time to cleanup our jsi functions (RenderCallback):
    pointee()->removeAllListeners();
  }
  Logger::log(TAG, "Cleanup ChoreographerWrapper done");
}

void ChoreographerWrapper::release() {
  std::unique_lock lock(_mutex);
  cleanup();
  PointerHolder::release();
}

void ChoreographerWrapper::onRuntimeDestroyed(jsi::Runtime*) {
  std::unique_lock lock(_mutex);
  Logger::log(TAG, "Runtime destroyed...");
  cleanup();
}

std::shared_ptr<Choreographer> ChoreographerWrapper::getChoreographer() {
  if (getIsValid()) {
    return pointee();
  }
  return nullptr;
}

} // namespace margelo
