//
// Created by Hanno Gödecke on 02.05.24.
//

#include "ChoreographerWrapper.h"

namespace margelo {

ChoreographerWrapper::~ChoreographerWrapper() {
  cleanup(false);
}

void ChoreographerWrapper::loadHybridMethods() {
  registerHybridMethod("start", &ChoreographerWrapper::start, this);
  registerHybridMethod("stop", &ChoreographerWrapper::stop, this);
  registerHybridMethod("setFrameCallback", &ChoreographerWrapper::setFrameCallback, this);
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

void ChoreographerWrapper::setFrameCallback(RenderCallback onFrameCallback) {
  std::unique_lock lock(_mutex);

  _renderCallback = std::make_unique<RenderCallback>(std::move(onFrameCallback));

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

  (*_renderCallback)(frameInfo);
}

void ChoreographerWrapper::cleanup(bool isRuntimeDestroyed) {
  std::unique_lock lock(_mutex);
  Logger::log(TAG, "Cleanup ChoreographerWrapper");

  if (isRuntimeDestroyed) {
    _renderCallback.release();
    Logger::log(TAG, "Runtime inactive, releasing callback...");
  } else {
    _renderCallback = nullptr;
    Logger::log(TAG, "Runtime active, cleaning callback...");
  }

  // Its possible that the pointer was already released manually by the user
  if (getIsValid()) {
    pointee()->stop();
  }
  if (_listener) {
    _listener->remove();
    _listener = nullptr;
  }
  Logger::log(TAG, "Cleanup ChoreographerWrapper done");
}

void ChoreographerWrapper::release() {
  cleanup(false);
  PointerHolder::release();
}

void ChoreographerWrapper::onRuntimeDestroyed(jsi::Runtime*) {
  Logger::log(TAG, "Runtime destroyed, stopping choreographer...");
  cleanup(true);
}

} // namespace margelo
