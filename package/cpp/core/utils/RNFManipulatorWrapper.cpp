#include "RNFManipulatorWrapper.h"

namespace margelo {
void ManipulatorWrapper::loadHybridMethods() {
  registerHybridMethod("grabBegin", &ManipulatorWrapper::grabBegin, this);
  registerHybridMethod("grabUpdate", &ManipulatorWrapper::grabUpdate, this);
  registerHybridMethod("grabEnd", &ManipulatorWrapper::grabEnd, this);
  registerHybridMethod("scroll", &ManipulatorWrapper::scroll, this);
  registerHybridMethod("update", &ManipulatorWrapper::update, this);
  registerHybridMethod("getLookAt", &ManipulatorWrapper::getLookAt, this);
}

void ManipulatorWrapper::grabBegin(float x, float y, bool strafe) {
  pointee()->grabBegin(x * _pixelDensityRatio, y * _pixelDensityRatio, strafe);
}

void ManipulatorWrapper::grabUpdate(float x, float y) {
  pointee()->grabUpdate(x * _pixelDensityRatio, y * _pixelDensityRatio);
}

void ManipulatorWrapper::grabEnd() {
  pointee()->grabEnd();
}

void ManipulatorWrapper::scroll(float x, float y, float delta) {
  pointee()->scroll(x * _pixelDensityRatio, y * _pixelDensityRatio, delta);
}

void ManipulatorWrapper::update(float dt) {
  pointee()->update(dt);
}

std::vector<std::vector<double>> ManipulatorWrapper::getLookAt() {
  math::float3 eye, center, up;
  pointee()->getLookAt(&eye, &center, &up);
  return {
      {eye.x, eye.y, eye.z},
      {center.x, center.y, center.z},
      {up.x, up.y, up.z},
  };
}

} // namespace margelo
