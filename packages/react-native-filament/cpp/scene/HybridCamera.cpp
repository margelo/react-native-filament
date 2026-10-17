#include "HybridCamera.hpp"

#include "engine/HybridEngine.hpp"
#include "utils/EntityConversion.hpp"
#include "utils/ThreadChecks.hpp"

#include <math/vec3.h>

namespace margelo::nitro::filament {

static ::filament::math::double3 toDouble3(const std::tuple<double, double, double>& value) {
  auto [x, y, z] = value;
  return {x, y, z};
}

HybridCamera::HybridCamera(std::shared_ptr<HybridEngine> engine, std::shared_ptr<CameraCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

double HybridCamera::getEntity() {
  return fromEntity(core_->entity());
}

void HybridCamera::lookAt(const std::tuple<double, double, double>& eye, const std::tuple<double, double, double>& center,
                          const std::tuple<double, double, double>& up) {
  usableCamera("Camera.lookAt()").lookAt(toDouble3(eye), toDouble3(center), toDouble3(up));
}

void HybridCamera::setLensProjection(double focalLengthMm, double aspect, double near, double far) {
  usableCamera("Camera.setLensProjection()").setLensProjection(focalLengthMm, aspect, near, far);
}

void HybridCamera::setProjection(double fovDegrees, double aspect, double near, double far) {
  usableCamera("Camera.setProjection()").setProjection(fovDegrees, aspect, near, far);
}

void HybridCamera::setOrthographicProjection(double left, double right, double bottom, double top, double near, double far) {
  usableCamera("Camera.setOrthographicProjection()")
      .setProjection(::filament::Camera::Projection::ORTHO, left, right, bottom, top, near, far);
}

void HybridCamera::setExposure(double aperture, double shutterSpeedSeconds, double sensitivityIso) {
  usableCamera("Camera.setExposure()")
      .setExposure(static_cast<float>(aperture), static_cast<float>(shutterSpeedSeconds), static_cast<float>(sensitivityIso));
}

void HybridCamera::dispose() {
  engineCore()->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridCamera::engineCore() const {
  return engine_->core();
}

const std::shared_ptr<CameraCore>& HybridCamera::core() const {
  return core_;
}

::filament::Camera& HybridCamera::usableCamera(const char* method) const {
  requireRenderThread(engineCore()->thread(), method);
  core_->requireLive(method);
  return core_->camera();
}

} // namespace margelo::nitro::filament
