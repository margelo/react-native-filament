#pragma once

#include "jsi/RNFPointerHolder.h"

#include "utils/RNFManipulatorWrapper.h"
#include <filament/Camera.h>

namespace margelo {
using namespace filament;

class CameraWrapper : public PointerHolder<Camera> {
public:
  explicit CameraWrapper(std::shared_ptr<Camera> camera) : PointerHolder("CameraWrapper", camera) {}

  void loadHybridMethods() override;

private:
  void lookAt(std::vector<double> eye, std::vector<double> center, std::vector<double> up);
  void setLensProjection(double fov, double aspect, double near, double far);
  void setProjection(double fovInDegrees, double aspect, double near, double far, std::string directionStr);
  // Convenience methods
  void lookAtCameraManipulator(std::shared_ptr<ManipulatorWrapper> cameraManipulator);
};
} // namespace margelo
