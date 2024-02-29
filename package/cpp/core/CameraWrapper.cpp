#include "CameraWrapper.h"

void margelo::CameraWrapper::loadHybridMethods() {
  registerHybridMethod("lookAtCameraManipulator", &CameraWrapper::lookAtCameraManipulator, this);
    registerHybridMethod("lookAt", &CameraWrapper::lookAt, this);
}

void margelo::CameraWrapper::lookAtCameraManipulator(std::shared_ptr<ManipulatorWrapper> cameraManipulator) {
  if (!cameraManipulator) {
    throw std::invalid_argument("CameraManipulator is null");
  }

  math::float3 eye, center, up;
  cameraManipulator->getManipulator()->getLookAt(&eye, &center, &up);
  _camera->lookAt(eye, center, up);
}

void margelo::CameraWrapper::lookAt(std::vector<double> eye, std::vector<double> center, std::vector<double> up) {
    math::float3 eyeVec = {static_cast<float>(eye[0]), static_cast<float>(eye[1]), static_cast<float>(eye[2])};
    math::float3 centerVec = {static_cast<float>(center[0]), static_cast<float>(center[1]), static_cast<float>(center[2])};
    math::float3 upVec = {static_cast<float>(up[0]), static_cast<float>(up[1]), static_cast<float>(up[2])};
    _camera->lookAt(eyeVec, centerVec, upVec);
}
