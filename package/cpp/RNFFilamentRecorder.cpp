//
// Created by Marc Rousavy on 02.05.24.
//

#include "RNFFilamentRecorder.h"
#include <jsi/jsi.h>

namespace margelo {

using namespace facebook;

FilamentRecorder::FilamentRecorder(std::shared_ptr<Dispatcher> renderThreadDispatcher, int width, int height, int fps, double bitRate)
    : HybridObject("FilamentRecorder"), _renderThreadDispatcher(renderThreadDispatcher), _width(width), _height(height), _fps(fps),
      _bitRate(bitRate), _listenerManager(ListenerManager<ReadyForMoreDataCallback>::create()) {
  Logger::log(TAG, "Creating %zu x %zu @ %zu FPS (%f bps) FilamentRecorder...", width, height, fps, bitRate);
}

FilamentRecorder::~FilamentRecorder() {
  Logger::log(TAG, "Destroying FilamentRecorder...");
}

void FilamentRecorder::loadHybridMethods() {
  registerHybridGetter("width", &FilamentRecorder::getWidth, this);
  registerHybridGetter("height", &FilamentRecorder::getHeight, this);
  registerHybridGetter("fps", &FilamentRecorder::getFps, this);
  registerHybridGetter("bitRate", &FilamentRecorder::getBitRate, this);
  registerHybridGetter("outputFile", &FilamentRecorder::getOutputFile, this);
  registerHybridGetter("isRecording", &FilamentRecorder::getIsRecording, this);
  registerHybridMethod("startRecording", &FilamentRecorder::startRecording, this);
  registerHybridMethod("stopRecording", &FilamentRecorder::stopRecording, this);
  registerHybridMethod("renderFrame", &FilamentRecorder::renderFrame, this);
  registerHybridMethod("addOnReadyForMoreDataListener", &FilamentRecorder::addOnReadyForMoreDataListener, this);
}

std::shared_ptr<Listener> FilamentRecorder::addOnReadyForMoreDataListener(ReadyForMoreDataCallback callback) {
  return _listenerManager->add(callback);
}

bool FilamentRecorder::onReadyForMoreData() {
  // notify all JS listeners
  bool shouldContinueNext = true;
  _listenerManager->forEach([&shouldContinueNext](const ReadyForMoreDataCallback& callback) {
    bool result = callback();
    if (!result) {
      shouldContinueNext = false;
    }
  });
  return shouldContinueNext;
}

} // namespace margelo
