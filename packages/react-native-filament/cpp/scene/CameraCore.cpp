#include "CameraCore.hpp"

#include "targets/ViewTargetCore.hpp"

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

Users<ViewTargetCore>& CameraCore::users() {
  return users_;
}

void CameraCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<ViewTargetCore>& target) { target->setCamera(nullptr); });
  destroyCamera(engine_->engine(), entity_);
}

} // namespace margelo::nitro::filament
