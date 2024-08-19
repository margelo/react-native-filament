//
//  AppleFilamentRecorder.h
//  react-native-filament
//
//  Created by Marc Rousavy on 02.05.24.
//

#pragma once

#include "RNFFilamentRecorder.h"
#include <AVFoundation/AVFoundation.h>
#include <CoreVideo/CoreVideo.h>
#include <Foundation/Foundation.h>
#include <mutex>

namespace margelo {

class AppleFilamentRecorder : public FilamentRecorder {
public:
  explicit AppleFilamentRecorder(std::shared_ptr<margelo::Dispatcher> renderThreadDispatcher, int width, int height, int fps, double bitRate);

  void* getNativeWindow() override;
  std::string getOutputFile() override;

  std::future<std::string> stopRecording() override;
  std::future<void> startRecording() override;

  bool getIsRecording() override {
    return _isRecording;
  }
  void renderFrame(double timestamp) override;

private:
  static bool getSupportsHEVC();
  static std::string getErrorMessage(NSError* error);

private:
  // Render Target is a single PixelBuffer that acts as a 32BGRA Metal Texture
  CVPixelBufferRef _pixelBuffer;
  // Actual recorder instance
  AVAssetWriter* _assetWriter;
  AVAssetWriterInput* _assetWriterInput;
  AVAssetWriterInputPixelBufferAdaptor* _pixelBufferAdaptor;
  // Path to record to - usually a temporary generated path.
  NSURL* _path;
  dispatch_queue_t _queue;
  bool _isRecording;
  size_t _frameCount = 0;
  std::mutex _mutex;
};

} // namespace margelo
