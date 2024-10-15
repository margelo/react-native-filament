//
// Created by Marc Rousavy on 02.05.24.
//

#include "RNFFilamentRecorder.h"
#include "RNFLogger.h"
#include <jsi/jsi.h>

namespace margelo {

using namespace facebook;

FilamentRecorder::FilamentRecorder(std::shared_ptr<nitro::Dispatcher> renderThreadDispatcher, int width, int height, int fps,
                                   double bitRate)
    : HybridObject("FilamentRecorder"), _renderThreadDispatcher(renderThreadDispatcher), _width(width), _height(height), _fps(fps),
      _bitRate(bitRate), _listenerManager(ListenerManager<ReadyForMoreDataCallback>::create()) {
  Logger::log(TAG, "Creating %zu x %zu @ %zu FPS (%f bps) FilamentRecorder...", width, height, fps, bitRate);
}

FilamentRecorder::~FilamentRecorder() {
  Logger::log(TAG, "Destroying FilamentRecorder...");
}

void FilamentRecorder::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridGetter("width", &FilamentRecorder::getWidth);
    proto.registerHybridGetter("height", &FilamentRecorder::getHeight);
    proto.registerHybridGetter("fps", &FilamentRecorder::getFps);
    proto.registerHybridGetter("bitRate", &FilamentRecorder::getBitRate);
    proto.registerHybridGetter("outputFile", &FilamentRecorder::getOutputFile);
    proto.registerHybridGetter("isRecording", &FilamentRecorder::getIsRecording);
    proto.registerHybridMethod("startRecording", &FilamentRecorder::startRecording);
    proto.registerHybridMethod("stopRecording", &FilamentRecorder::stopRecording);
    proto.registerHybridMethod("renderFrame", &FilamentRecorder::renderFrame);
    //        TODO: nitro
    //        proto.registerHybridMethod("addOnReadyForMoreDataListener", &FilamentRecorder::addOnReadyForMoreDataListener);
  });
}

std::shared_ptr<Listener> FilamentRecorder::addOnReadyForMoreDataListener(const ReadyForMoreDataCallback& callback) {
  return _listenerManager->add(callback);
}

bool FilamentRecorder::onReadyForMoreData() {
  // notify all JS listeners
  bool shouldContinueNext = _listenerManager->getHasListeners();
  _listenerManager->forEach([&shouldContinueNext](const ReadyForMoreDataCallback& callback) {
    bool result = callback();
    if (!result) {
      shouldContinueNext = false;
    }
  });
  return shouldContinueNext;
}

} // namespace margelo
