#pragma once

#include "jsi/HybridObject.h"

#include "utils/ManipulatorWrapper.h"
#include <filament/Camera.h>

namespace margelo {
using namespace filament;

class CameraWrapper : public HybridObject {
public:
  explicit CameraWrapper(const std::shared_ptr<Camera>& camera) : _camera(std::move(camera)) {}

  void loadHybridMethods() override;

  const std::shared_ptr<Camera>& getCamera() {
    return _camera;
  }

private:
  std::shared_ptr<Camera> _camera;

private:
  void lookAt(std::vector<double> eye, std::vector<double> center, std::vector<double> up);
  // Convenience methods
  void lookAtCameraManipulator(std::shared_ptr<ManipulatorWrapper> cameraManipulator);
};
} // namespace margelo