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
  explicit AppleFilamentRecorder(int width, int height, int fps, double bitRate);

  void* getNativeWindow() override;
  std::string getOutputFile() override;

  std::future<std::string> stopRecording() override;
  std::future<void> startRecording() override;

  bool getIsRecording() override {
    return _isRecording;
  }
  void renderFrame(double timestamp) override;

private:
  // Render Target is a single PixelBuffer that acts as a 32BGRA Metal Texture
  CVPixelBufferRef _pixelBuffer;
  CVPixelBufferPoolRef _pixelBufferPool;
  // Actual recorder instance
  AVAssetWriter* _assetWriter;
  AVAssetWriterInput* _assetWriterInput;
  AVAssetWriterInputPixelBufferAdaptor* _pixelBufferAdaptor;
  // Path to record to - usually a temporary generated path.
  NSURL* _path;
  dispatch_queue_t _queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0ul);
  bool _isRecording;
};

} // namespace margelo
