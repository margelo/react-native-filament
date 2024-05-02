//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <future>
#include <jsi/jsi.h>
#include <string>

#include "jsi/HybridObject.h"

namespace margelo {

using namespace facebook;

class FilamentRecorder : public HybridObject {
public:
  explicit FilamentRecorder(int width, int height, int fps);
  ~FilamentRecorder();

public:
  int getWidth() {
    return _width;
  }
  int getHeight() {
    return _height;
  }
  int getFps() {
    return _fps;
  }

  virtual bool getIsRecording() = 0;

  virtual std::future<void> startRecording() = 0;
  virtual std::future<std::string> stopRecording() = 0;
  
  /**
   Get the native window that can be used as a render target.
   - On iOS, this is a `CVPixelBuffer`
   - On Android, this is a `ANativeWindow` (`android.media.Surface`)
   The `FilamentRecoder` has exclusive ownership of the native window.
   */
  virtual void* getNativeWindow() = 0;

private:
  static constexpr auto TAG = "FilamentRecorder";
  int _width;
  int _height;
  int _fps;

public:
  void loadHybridMethods() override;
};

} // namespace margelo
