//
//  AppleFilamentRecorder.h
//  react-native-filament
//
//  Created by Marc Rousavy on 02.05.24.
//

#pragma once

#include "FilamentRecorder.h"

namespace margelo {

class AppleFilamentRecorder : public FilamentRecorder {
public:
  explicit AppleFilamentRecorder(int width, int height, int fps);

  void* getNativeWindow() override;
  std::future<std::string> stopRecording() override;
  std::future<void> startRecording() override;
  bool getIsRecording() override {
    return _isRecording;
  }

private:
  bool _isRecording;
};

} // namespace margelo
