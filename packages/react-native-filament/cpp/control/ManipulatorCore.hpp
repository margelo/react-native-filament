#pragma once

#include "LookAt.hpp"
#include "ManipulatorCommandQueue.hpp"
#include "OrbitManipulatorOptions.hpp"
#include "resources/Users.hpp"

#include <camutils/Manipulator.h>

#include <atomic>
#include <memory>
#include <mutex>
#include <optional>
#include <utility>

namespace margelo::nitro::filament {

class CameraCore;

class ManipulatorCore final {
public:
  explicit ManipulatorCore(const OrbitManipulatorOptions& options);

  ManipulatorCommandQueue& commands();
  void setViewport(double width, double height);
  LookAt lookAt() const;
  void drain(double deltaSeconds);
  void follow(const std::shared_ptr<CameraCore>& camera);
  void unfollow(const std::shared_ptr<CameraCore>& camera);
  void stop();
  bool isStopped() const;

private:
  using Manipulator = ::filament::camutils::Manipulator<float>;

  void apply(const ManipulatorCommand& command);
  ::filament::math::float3 eye() const;
  void publish();
  int toInternalX(float x) const;
  int toInternalY(float y) const;

  std::unique_ptr<Manipulator> manipulator_;
  ::filament::math::float3 homeTarget_;
  ::filament::math::float3 pivot_;
  bool strafing_ = false;
  LookAt cameraPose_;
  ManipulatorCommandQueue commands_;
  std::mutex viewportMutex_;
  std::optional<std::pair<double, double>> pendingViewport_;
  int viewportHeight_ = 1;
  mutable std::mutex lookAtMutex_;
  LookAt lookAt_;
  Users<CameraCore> cameras_;
  std::atomic<bool> stopped_{false};
};

} // namespace margelo::nitro::filament
