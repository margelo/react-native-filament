#include "CameraWrapper.h"

void margelo::CameraWrapper::loadHybridMethods() {
  registerHybridMethod("lookAt", &CameraWrapper::lookAt, this);
}

void margelo::CameraWrapper::lookAt(std::shared_ptr<ManipulatorWrapper> cameraManipulator) {
  if (!cameraManipulator) {
    throw std::invalid_argument("CameraManipulator is null");
  }

  math::float3 eye, center, up;
  cameraManipulator->getManipulator()->getLookAt(&eye, &center, &up);
  _camera->lookAt(eye, center, up);
}
