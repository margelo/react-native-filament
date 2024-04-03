#pragma once

#include "jsi/HybridObject.h"

#include "utils/ManipulatorWrapper.h"
#include <filament/Camera.h>

namespace margelo {
using namespace filament;

class CameraWrapper : public HybridObject {
public:
  explicit CameraWrapper(const std::shared_ptr<Camera>& camera) : HybridObject("CameraWrapper"), _camera(camera) {}

  void loadHybridMethods() override;

  const std::shared_ptr<Camera>& getCamera() {
    return _camera;
  }

private:
  std::shared_ptr<Camera> _camera;

private:
  void lookAt(std::vector<double> eye, std::vector<double> center, std::vector<double> up);
  void setLensProjection(double fov, double aspect, double near, double far);
  // TODO(Hanno): Add directionStr , Camera::Fov directionStr = Camera::Fov::VERTICAL
  void setProjection(double fovInDegrees, double aspect, double near, double far, std::string directionStr);
  // Convenience methods
  void lookAtCameraManipulator(const std::shared_ptr<ManipulatorWrapper>& cameraManipulator);
};
} // namespace margelo
