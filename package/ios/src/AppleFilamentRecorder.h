//
//  AppleFilamentRecorder.h
//  react-native-filament
//
//  Created by Marc Rousavy on 02.05.24.
//

#pragma once

#include "FilamentRecorder.h"
#include <AVFoundation/AVFoundation.h>
#include <CoreVideo/CoreVideo.h>
#include <Foundation/Foundation.h>

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
  // Render Target is a single PixelBuffer that acts as a 32BGRA Metal Texture
  CVPixelBufferRef _pixelBuffer;
  // Actual recorder instance
  AVAssetWriter* _assetWriter;
  // Path to record to - usually a temporary generated path.
  NSURL* _path;
  bool _isRecording;
};

} // namespace margelo
