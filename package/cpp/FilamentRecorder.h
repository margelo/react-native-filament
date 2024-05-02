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
  explicit FilamentRecorder(int width, int height, int fps, long bitRate);
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
  long getBitRate() {
    return _bitRate;
  }

  virtual bool getIsRecording() = 0;

  virtual std::future<void> startRecording() = 0;
  virtual std::future<std::string> stopRecording() = 0;

  /**
   Render the current Frame to the video recording, with the given timestamp.
   */
  virtual void renderFrame(long timestamp) = 0;

  /**
   Get the native window that can be used as a render target.
   - On iOS, this is a `CVPixelBuffer`
   - On Android, this is a `ANativeWindow` (`android.media.Surface`)
   The `FilamentRecoder` has exclusive ownership of the native window.
   */
  virtual void* getNativeWindow() = 0;

protected:
  static constexpr auto TAG = "FilamentRecorder";

private:
  int _width;
  int _height;
  int _fps;
  long _bitRate;

public:
  void loadHybridMethods() override;
};

} // namespace margelo
