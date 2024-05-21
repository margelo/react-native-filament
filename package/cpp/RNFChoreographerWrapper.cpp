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

  // Add the user-provided callback to the list of callbacks that we will call on each frame
  Logger::log(TAG, "Adding frame callback listener");
  std::shared_ptr<Listener> listener = _renderCallbackListeners->add(onFrameCallback);

  // We only keep one listener for the choreographer itself
  if (!_choreographerListener) {
    Logger::log(TAG, "Setting up choreographer listener");
    std::weak_ptr<ChoreographerWrapper> weakThis = shared<ChoreographerWrapper>();
    _choreographerListener = pointee()->addOnFrameListener([weakThis](double timestamp) {
      auto sharedThis = weakThis.lock();
      if (sharedThis) {
        sharedThis->renderCallback(timestamp);
      }
    });
  }

  return listener;
}

void ChoreographerWrapper::renderCallback(double timestamp) {
  std::unique_lock lock(_mutex);

  if (_startTime == 0) {
    [[unlikely]];
    _startTime = timestamp;
  }

  double passedSeconds = (timestamp - _startTime) / 1e9;
  double timeSinceLastFrame = (timestamp - _lastFrameTime) / 1e9;
  _lastFrameTime = timestamp;
  FrameInfo frameInfo = {
      {"timestamp", timestamp},
      {"passedSeconds", passedSeconds},
      {"startTime", _startTime},
      {"timeSinceLastFrame", timeSinceLastFrame},
  };

  _renderCallbackListeners->forEach([frameInfo](const RenderCallback& callback) { callback(frameInfo); });
}

void ChoreographerWrapper::cleanup() {
  std::unique_lock lock(_mutex);
  Logger::log(TAG, "Cleanup ChoreographerWrapper");

  // Its possible that the pointer was already released manually by the user
  if (getIsValid()) {
    pointee()->stop();
  }
  if (_choreographerListener) {
    _choreographerListener->remove();
    _choreographerListener = nullptr;
  }
  _renderCallbackListeners = nullptr;
  Logger::log(TAG, "Cleanup ChoreographerWrapper done");
}

void ChoreographerWrapper::release() {
  cleanup();
  PointerHolder::release();
}

void ChoreographerWrapper::onRuntimeDestroyed(jsi::Runtime*) {
  std::unique_lock lock(_mutex);
  Logger::log(TAG, "Runtime destroyed, stopping choreographer...");

  if (getIsValid()) {
    pointee()->stop();
  }

  // Clear all listeners now - that will cause the listeners function destructors to be called
  // When onRuntimeDestroyed gets called we still have time to cleanup our jsi functions:
  _renderCallbackListeners = nullptr;
}

std::shared_ptr<Choreographer> ChoreographerWrapper::getChoreographer() {
  if (getIsValid()) {
    return pointee();
  }
  return nullptr;
}

} // namespace margelo
