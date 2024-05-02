//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>
#include <string>
#include <future>

#include "jsi/HybridObject.h"

namespace margelo {

using namespace facebook;

class FilamentRecorder : public HybridObject {
public:
  explicit FilamentRecorder(int width, int height, int fps) : HybridObject("FilamentRecorder"), _width(width), _height(height), _fps(fps) {}

public:
  int getWidth() { return _width; }
  int getHeight() { return _height; }
  int getFps() { return _fps; }

  virtual bool getIsRecording() = 0;

  virtual std::future<void> startRecording() = 0;
  virtual std::future<std::string> stopRecording() = 0;

private:
  static constexpr auto TAG = "FilamentRecorder";
  int _width;
  int _height;
  int _fps;

public:
  void loadHybridMethods() override;
};

} // namespace margelo
