#include "CameraCore.hpp"

#include "control/ManipulatorCore.hpp"
#include "targets/ViewHost.hpp"
#include "utils/MatrixConversion.hpp"

#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

static void destroyCamera(::filament::Engine& engine, utils::Entity entity) {
  engine.destroyCameraComponent(entity);
  utils::EntityManager::get().destroy(entity);
}

CameraCore::CameraCore(std::shared_ptr<EngineCore> engine)
    : Resource("Camera"), engine_(std::move(engine)), entity_(utils::EntityManager::get().create()),
      camera_(engine_->engine().createCamera(entity_)) {}

CameraCore::~CameraCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, entity = entity_] { destroyCamera(engine->engine(), entity); }});
  }
}

utils::Entity CameraCore::entity() const {
  return entity_;
}

::filament::Camera& CameraCore::camera() {
  return *camera_;
}

Users<ViewHost>& CameraCore::users() {
  return users_;
}

void CameraCore::lookAt(const LookAt& pose) {
  ::filament::math::float3 eye = toFloat3(pose.eye);
  ::filament::math::float3 target = toFloat3(pose.target);
  ::filament::math::float3 up = toFloat3(pose.up);
  camera_->lookAt(eye, target, up);
}

void CameraCore::followManipulator(const std::shared_ptr<ManipulatorCore>& manipulator) {
  auto self = std::static_pointer_cast<CameraCore>(shared_from_this());
  if (manipulator_ != nullptr) {
    manipulator_->unfollow(self);
  }
  manipulator_ = manipulator;
  if (manipulator_ != nullptr) {
    manipulator_->follow(self);
  }
}

void CameraCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<ViewHost>& target) { target->setCamera(nullptr); });
  followManipulator(nullptr);
  destroyCamera(engine_->engine(), entity_);
}

} // namespace margelo::nitro::filament
