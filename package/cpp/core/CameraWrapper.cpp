#include "CameraWrapper.h"
#include "CameraFovEnum.h"

void margelo::CameraWrapper::loadHybridMethods() {
  registerHybridMethod("lookAtCameraManipulator", &CameraWrapper::lookAtCameraManipulator, this);
  registerHybridMethod("lookAt", &CameraWrapper::lookAt, this);
  registerHybridMethod("setLensProjection", &CameraWrapper::setLensProjection, this);
  registerHybridMethod("setProjection", &CameraWrapper::setProjection, this);
}

void margelo::CameraWrapper::lookAtCameraManipulator(std::shared_ptr<ManipulatorWrapper> cameraManipulator) {
  if (!cameraManipulator) {
    throw std::invalid_argument("CameraManipulator is null");
  }

  math::float3 eye, center, up;
  cameraManipulator->getManipulator()->getLookAt(&eye, &center, &up);
  pointee()->lookAt(eye, center, up);
}

void margelo::CameraWrapper::lookAt(std::vector<double> eye, std::vector<double> center, std::vector<double> up) {
  math::float3 eyeVec = {static_cast<float>(eye[0]), static_cast<float>(eye[1]), static_cast<float>(eye[2])};
  math::float3 centerVec = {static_cast<float>(center[0]), static_cast<float>(center[1]), static_cast<float>(center[2])};
  math::float3 upVec = {static_cast<float>(up[0]), static_cast<float>(up[1]), static_cast<float>(up[2])};
  pointee()->lookAt(eyeVec, centerVec, upVec);
}

void margelo::CameraWrapper::setLensProjection(double fov, double aspect, double near, double far) {
  pointee()->setLensProjection(static_cast<float>(fov), static_cast<float>(aspect), static_cast<float>(near), static_cast<float>(far));
}

void margelo::CameraWrapper::setProjection(double fovInDegrees, double aspect, double near, double far,
                                           std::string directionStr = "vertical") {
  Camera::Fov direction;
  EnumMapper::convertJSUnionToEnum(directionStr, &direction);

  pointee()->setProjection(static_cast<float>(fovInDegrees), static_cast<float>(aspect), static_cast<float>(near), static_cast<float>(far),
                           direction);
}
