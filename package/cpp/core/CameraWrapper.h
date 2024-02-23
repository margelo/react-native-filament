#pragma once

#include "jsi/HybridObject.h"

#include <filament/Camera.h>

namespace margelo {
using namespace filament;

class CameraWrapper : public HybridObject {
public:
  explicit CameraWrapper(Camera* camera) : _camera(camera) {}
  ~CameraWrapper();

  void loadHybridMethods() override;

private:
  Camera* _camera;
};
} // namespace margelo