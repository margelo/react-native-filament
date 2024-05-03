//
// Created by Hanno Gödecke on 02.05.24.
//

#include "ChoreographerWrapper.h"

namespace margelo {

void ChoreographerWrapper::loadHybridMethods() {
  registerHybridMethod("start", &ChoreographerWrapper::start, this);
  registerHybridMethod("stop", &ChoreographerWrapper::stop, this);
  registerHybridMethod("setFrameCallback", &ChoreographerWrapper::setFrameCallback, this);
}

void ChoreographerWrapper::start() {
  std::unique_lock lock(_mutex);

  pointee()->start();
}

void ChoreographerWrapper::stop() {
  std::unique_lock lock(_mutex);

  pointee()->stop();
}

void ChoreographerWrapper::setFrameCallback(RenderCallback onFrameCallback) {
  std::unique_lock lock(_mutex);

  _renderCallback = onFrameCallback;

  if (_listener) {
    _listener->remove();
  }

  std::weak_ptr<ChoreographerWrapper> weakThis = shared<ChoreographerWrapper>();
  _listener = pointee()->addOnFrameListener([onFrameCallback, weakThis](double timestamp) {
    auto sharedThis = weakThis.lock();
    if (sharedThis) {
      sharedThis->renderCallback(timestamp);
    }
  });
}

void ChoreographerWrapper::renderCallback(double timestamp) {
  std::unique_lock lock(_mutex);

  if (_startTime == 0) {
    [[unlikely]];
    _startTime = timestamp;
  }

  if (_renderCallback == nullptr) {
    [[unlikely]];
    Logger::log(TAG, "⚠️ Calling Choreographer renderCallback without a valid renderCallback function!");
    return;
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

  _renderCallback(frameInfo);
}

// This will be called when the runtime that created the EngineImpl gets destroyed.
// The same runtime/thread that creates the EngineImpl is the one the renderCallback
// jsi::Function has been created on, and needs to be destroyed on.
// Additionally we want to stop and release the choreographer listener, so there is no
// risk of it being called (and then calling the renderCallback which is invalid by then).
void ChoreographerWrapper::onRuntimeDestroyed(jsi::Runtime*) {
  std::unique_lock lock(_mutex);

  Logger::log(TAG, "Runtime destroyed, stopping choreographer...");
  _renderCallback = nullptr;
  // Its possible that the pointer was already released manually by the user
  if (getIsValid()) {
    pointee()->stop();
  }
  if (_listener) {
    _listener->remove();
    _listener = nullptr;
  }
}
} // namespace margelo
