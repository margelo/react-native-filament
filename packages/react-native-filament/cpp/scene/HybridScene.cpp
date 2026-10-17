#include "HybridScene.hpp"

#include "HybridSkybox.hpp"
#include "engine/HybridEngine.hpp"
#include "utils/EngineChecks.hpp"
#include "utils/EntityConversion.hpp"
#include "utils/ThreadChecks.hpp"

#include <filament/LightManager.h>
#include <filament/RenderableManager.h>
#include <stdexcept>
#include <string>
#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

HybridScene::HybridScene(std::shared_ptr<HybridEngine> engine, std::shared_ptr<SceneCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

double HybridScene::getEntityCount() {
  requireUsable("Scene.entityCount");
  return static_cast<double>(core_->scene().getEntityCount());
}

void HybridScene::addEntity(double entity) {
  requireUsable("Scene.addEntity()");
  utils::Entity resolved = toEntity(entity);
  ::filament::Engine& engine = engineCore()->engine();
  bool hasComponent = engine.getRenderableManager().hasComponent(resolved) || engine.getLightManager().hasComponent(resolved);
  if (!utils::EntityManager::get().isAlive(resolved) || !hasComponent) {
    throw std::invalid_argument("FilamentInvalidEntityError: Scene.addEntity(" + std::to_string(static_cast<int64_t>(entity)) +
                                ") needs a live entity with a renderable or light component in this Engine.");
  }
  core_->scene().addEntity(resolved);
}

void HybridScene::removeEntity(double entity) {
  requireUsable("Scene.removeEntity()");
  core_->scene().remove(toEntity(entity));
}

void HybridScene::setSkybox(const std::optional<std::shared_ptr<HybridSkyboxSpec>>& skybox) {
  requireUsable("Scene.setSkybox()");
  if (!skybox.has_value()) {
    core_->setSkybox(nullptr);
    return;
  }
  auto resolved = requireSameEngine<HybridSkybox>(skybox.value(), *engineCore(), "Scene.setSkybox()");
  resolved->core()->requireLive("Scene.setSkybox()");
  core_->setSkybox(resolved->core());
}

void HybridScene::dispose() {
  engineCore()->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridScene::engineCore() const {
  return engine_->core();
}

const std::shared_ptr<SceneCore>& HybridScene::core() const {
  return core_;
}

void HybridScene::requireUsable(const char* method) const {
  requireRenderThread(engineCore()->thread(), method);
  core_->requireLive(method);
}

} // namespace margelo::nitro::filament
