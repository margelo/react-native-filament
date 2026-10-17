#pragma once

#include "CameraCore.hpp"
#include "HybridCameraSpec.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridCamera final : public HybridCameraSpec {
public:
  HybridCamera(std::shared_ptr<HybridEngine> engine, std::shared_ptr<CameraCore> core);

  double getEntity() override;
  void lookAt(const std::tuple<double, double, double>& eye, const std::tuple<double, double, double>& center,
              const std::tuple<double, double, double>& up) override;
  void setLensProjection(double focalLengthMm, double aspect, double near, double far) override;
  void setProjection(double fovDegrees, double aspect, double near, double far) override;
  void setOrthographicProjection(double left, double right, double bottom, double top, double near, double far) override;
  void setExposure(double aperture, double shutterSpeedSeconds, double sensitivityIso) override;
  void followManipulator(const std::optional<std::shared_ptr<HybridCameraManipulatorSpec>>& manipulator) override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<CameraCore>& core() const;

private:
  ::filament::Camera& usableCamera(const char* method) const;

  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<CameraCore> core_;
};

} // namespace margelo::nitro::filament
