#include "GeometryCore.hpp"

#include "scene/SceneCore.hpp"

#include <filament/RenderableManager.h>
#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

GeometryCore::GeometryCore(std::shared_ptr<EngineCore> engine, utils::Entity entity, Buffers buffers)
    : Resource("Renderable"), engine_(std::move(engine)), entity_(entity), buffers_(buffers) {}

GeometryCore::~GeometryCore() {
  if (!isDestroyed()) {
    engine_->thread().post(
        {.run = [engine = engine_, entity = entity_, buffers = buffers_] { destroyGeometry(*engine, entity, buffers); }});
  }
}

utils::Entity GeometryCore::entity() const {
  return entity_;
}

void GeometryCore::destroyNative() {
  destroyGeometry(*engine_, entity_, buffers_);
}

void GeometryCore::destroyGeometry(EngineCore& engine, utils::Entity entity, Buffers buffers) {
  engine.scenes().forEach([&](const std::shared_ptr<SceneCore>& scene) {
    if (!scene->isDestroyed()) {
      scene->scene().remove(entity);
    }
  });
  engine.materialAssignments().releaseEntities(&entity, 1, nullptr, 0);
  engine.engine().getRenderableManager().destroy(entity);
  utils::EntityManager::get().destroy(entity);
  engine.engine().destroy(buffers.vertices);
  engine.engine().destroy(buffers.indices);
}

} // namespace margelo::nitro::filament
