//
// Created by Marc Rousavy on 02.05.24.
//

#include "FilamentRecorder.h"
#include <jsi/jsi.h>

namespace margelo {

using namespace facebook;

FilamentRecorder::FilamentRecorder(int width, int height, int fps, long bitRate)
    : HybridObject("FilamentRecorder"), _width(width), _height(height), _fps(fps), _bitRate(bitRate) {
  Logger::log(TAG, "Creating %zu x %zu @ %zu FPS (%zu bps) FilamentRecorder...", width, height, fps, bitRate);
}

FilamentRecorder::~FilamentRecorder() {
  Logger::log(TAG, "Destroying FilamentRecorder...");
}

void FilamentRecorder::loadHybridMethods() {
  registerHybridGetter("width", &FilamentRecorder::getWidth, this);
  registerHybridGetter("height", &FilamentRecorder::getHeight, this);
  registerHybridGetter("fps", &FilamentRecorder::getFps, this);
  registerHybridGetter("bitRate", &FilamentRecorder::getBitRate, this);
  registerHybridGetter("isRecording", &FilamentRecorder::getIsRecording, this);
  registerHybridMethod("startRecording", &FilamentRecorder::startRecording, this);
  registerHybridMethod("stopRecording", &FilamentRecorder::stopRecording, this);
}

} // namespace margelo
