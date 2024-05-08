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
  explicit FilamentRecorder(int width, int height, int fps, double bitRate);
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
  double getBitRate() {
    return _bitRate;
  }

  virtual bool getIsRecording() = 0;

  virtual std::future<void> startRecording() = 0;
  virtual std::future<std::string> stopRecording() = 0;

  /**
   * Returns the absolute path of the file this Recorder is- or will be recording to.
   */
  virtual std::string getOutputFile() = 0;

  /**
   * Render the current Frame to the video recording, with the given timestamp.
   */
  virtual void renderFrame(double timestamp) = 0;

  /**
   * Get the native window that can be used as a render target.
   * - On iOS, this is a `CVPixelBuffer`
   * - On Android, this is a `ANativeWindow` (`android.media.Surface`)
   * The `FilamentRecorder` has exclusive ownership of the native window.
   */
  virtual void* getNativeWindow() = 0;

protected:
  static constexpr auto TAG = "FilamentRecorder";

private:
  int _width;
  int _height;
  int _fps;
  double _bitRate;

public:
  void loadHybridMethods() override;
};

} // namespace margelo
