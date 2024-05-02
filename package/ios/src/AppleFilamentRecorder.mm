//
//  AppleFilamentRecorder.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 02.05.24.
//

#include "AppleFilamentRecorder.h"

namespace margelo {

AppleFilamentRecorder::AppleFilamentRecorder(int width, int height, int fps) : FilamentRecorder(width, height, fps) {}

void* AppleFilamentRecorder::getNativeWindow() {
  throw std::runtime_error("getNativeWindow() is not yet implemented!");
}

std::future<void> AppleFilamentRecorder::startRecording() {
  return std::async(std::launch::async, []() { throw std::runtime_error("startRecording() is not yet implemented!"); });
}

std::future<std::string> AppleFilamentRecorder::stopRecording() {
  auto self = shared<AppleFilamentRecorder>();
  return std::async(std::launch::async, [self]() -> std::string { throw std::runtime_error("stopRecording() is not yet implemented!"); });
}

} // namespace margelo
