#include "ManipulatorCore.hpp"

#include "scene/CameraCore.hpp"

#include <cmath>

namespace margelo::nitro::filament {

namespace {

  constexpr float kSubPoints = 16;

  std::tuple<double, double, double> toTuple(const ::filament::math::float3& value) {
    return {value.x, value.y, value.z};
  }

} // namespace

ManipulatorCore::ManipulatorCore(const OrbitManipulatorOptions& options) {
  auto [homeX, homeY, homeZ] = options.homePosition.value_or(std::make_tuple(0.0, 0.0, 4.0));
  auto [targetX, targetY, targetZ] = options.targetPosition.value_or(std::make_tuple(0.0, 0.0, 0.0));
  auto [upX, upY, upZ] = options.upVector.value_or(std::make_tuple(0.0, 1.0, 0.0));
  auto orbitSpeed = static_cast<float>(options.orbitSpeed.value_or(0.005) / kSubPoints);
  manipulator_.reset(Manipulator::Builder()
                         .viewport(static_cast<int>(kSubPoints), static_cast<int>(kSubPoints))
                         .orbitHomePosition(static_cast<float>(homeX), static_cast<float>(homeY), static_cast<float>(homeZ))
                         .targetPosition(static_cast<float>(targetX), static_cast<float>(targetY), static_cast<float>(targetZ))
                         .upVector(static_cast<float>(upX), static_cast<float>(upY), static_cast<float>(upZ))
                         .orbitSpeed(orbitSpeed, orbitSpeed)
                         .zoomSpeed(static_cast<float>(options.zoomSpeed.value_or(0.01)))
                         .build(::filament::camutils::Mode::ORBIT));
  viewportHeight_ = static_cast<int>(kSubPoints);
  homeTarget_ = {static_cast<float>(targetX), static_cast<float>(targetY), static_cast<float>(targetZ)};
  pivot_ = homeTarget_;
  publish();
}

ManipulatorCommandQueue& ManipulatorCore::commands() {
  return commands_;
}

void ManipulatorCore::setViewport(double width, double height) {
  std::unique_lock lock(viewportMutex_);
  pendingViewport_ = std::make_pair(width, height);
}

LookAt ManipulatorCore::lookAt() const {
  std::unique_lock lock(lookAtMutex_);
  return lookAt_;
}

void ManipulatorCore::drain(double deltaSeconds) {
  std::optional<std::pair<double, double>> viewport;
  {
    std::unique_lock lock(viewportMutex_);
    viewport.swap(pendingViewport_);
  }
  if (viewport.has_value()) {
    viewportHeight_ = std::max(1, static_cast<int>(std::lround(viewport->second * kSubPoints)));
    manipulator_->setViewport(std::max(1, static_cast<int>(std::lround(viewport->first * kSubPoints))), viewportHeight_);
  }
  const std::vector<ManipulatorCommand>& pending = commands_.swap();
  bool changed = !pending.empty();
  for (const ManipulatorCommand& command : pending) {
    apply(command);
  }
  commands_.recycle();
  manipulator_->update(static_cast<float>(deltaSeconds));
  if (changed) {
    publish();
  }
}

void ManipulatorCore::follow(const std::shared_ptr<CameraCore>& camera) {
  cameras_.add(camera);
  camera->lookAt(cameraPose_);
}

void ManipulatorCore::unfollow(const std::shared_ptr<CameraCore>& camera) {
  cameras_.remove(camera);
}

void ManipulatorCore::stop() {
  stopped_ = true;
}

bool ManipulatorCore::isStopped() const {
  return stopped_;
}

void ManipulatorCore::apply(const ManipulatorCommand& command) {
  std::visit(
      [this](const auto& value) {
        using Command = std::decay_t<decltype(value)>;
        if constexpr (std::is_same_v<Command, GrabBegin>) {
          strafing_ = value.strafe;
          manipulator_->grabBegin(toInternalX(value.x), toInternalY(value.y), value.strafe);
        } else if constexpr (std::is_same_v<Command, GrabUpdate>) {
          ::filament::math::float3 before = eye();
          manipulator_->grabUpdate(toInternalX(value.x), toInternalY(value.y));
          if (strafing_) {
            pivot_ += eye() - before;
          }
        } else if constexpr (std::is_same_v<Command, GrabEnd>) {
          strafing_ = false;
          manipulator_->grabEnd();
        } else if constexpr (std::is_same_v<Command, Scroll>) {
          manipulator_->scroll(toInternalX(value.x), toInternalY(value.y), value.delta);
        } else {
          manipulator_->jumpToBookmark(manipulator_->getHomeBookmark());
          pivot_ = homeTarget_;
        }
      },
      command);
}

::filament::math::float3 ManipulatorCore::eye() const {
  ::filament::math::float3 eye;
  ::filament::math::float3 target;
  ::filament::math::float3 up;
  manipulator_->getLookAt(&eye, &target, &up);
  return eye;
}

void ManipulatorCore::publish() {
  ::filament::math::float3 eye;
  ::filament::math::float3 target;
  ::filament::math::float3 up;
  manipulator_->getLookAt(&eye, &target, &up);
  cameraPose_ = LookAt(toTuple(eye), toTuple(target), toTuple(up));
  {
    std::unique_lock lock(lookAtMutex_);
    lookAt_ = LookAt(toTuple(eye), toTuple(pivot_), toTuple(up));
  }
  cameras_.forEach([&](const std::shared_ptr<CameraCore>& camera) {
    if (camera->isLive()) {
      camera->lookAt(cameraPose_);
    }
  });
}

int ManipulatorCore::toInternalX(float x) const {
  return static_cast<int>(std::lround(x * kSubPoints));
}

int ManipulatorCore::toInternalY(float y) const {
  return viewportHeight_ - static_cast<int>(std::lround(y * kSubPoints));
}

} // namespace margelo::nitro::filament
