#include "HybridRenderableManager.hpp"

#include "utils/ComponentChecks.hpp"
#include "utils/IndexChecks.hpp"
#include "utils/MatrixConversion.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

HybridRenderableManager::HybridRenderableManager(std::shared_ptr<EngineCore> engine) : HybridObject(TAG), engine_(std::move(engine)) {}

double HybridRenderableManager::getPrimitiveCount(double entity) {
  auto [manager, instance] = renderable(entity, "RenderableManager.getPrimitiveCount()");
  return static_cast<double>(manager.getPrimitiveCount(instance));
}

bool HybridRenderableManager::isShadowCaster(double entity) {
  auto [manager, instance] = renderable(entity, "RenderableManager.isShadowCaster()");
  return manager.isShadowCaster(instance);
}

void HybridRenderableManager::setCastShadows(double entity, bool castShadows) {
  auto [manager, instance] = renderable(entity, "RenderableManager.setCastShadows()");
  manager.setCastShadows(instance, castShadows);
}

bool HybridRenderableManager::isShadowReceiver(double entity) {
  auto [manager, instance] = renderable(entity, "RenderableManager.isShadowReceiver()");
  return manager.isShadowReceiver(instance);
}

void HybridRenderableManager::setReceiveShadows(double entity, bool receiveShadows) {
  auto [manager, instance] = renderable(entity, "RenderableManager.setReceiveShadows()");
  manager.setReceiveShadows(instance, receiveShadows);
}

Aabb HybridRenderableManager::getAxisAlignedBoundingBox(double entity) {
  auto [manager, instance] = renderable(entity, "RenderableManager.getAxisAlignedBoundingBox()");
  const ::filament::Box& box = manager.getAxisAlignedBoundingBox(instance);
  return Aabb(std::make_tuple(box.center.x, box.center.y, box.center.z),
              std::make_tuple(box.halfExtent.x, box.halfExtent.y, box.halfExtent.z));
}

void HybridRenderableManager::setAxisAlignedBoundingBox(double entity, const Aabb& boundingBox) {
  auto [manager, instance] = renderable(entity, "RenderableManager.setAxisAlignedBoundingBox()");
  manager.setAxisAlignedBoundingBox(
      instance, ::filament::Box{.center = toFloat3(boundingBox.center), .halfExtent = toFloat3(boundingBox.halfExtent)});
}

void HybridRenderableManager::scaleBoundingBox(double entity, double scale) {
  auto [manager, instance] = renderable(entity, "RenderableManager.scaleBoundingBox()");
  ::filament::Box box = manager.getAxisAlignedBoundingBox(instance);
  box.halfExtent *= static_cast<float>(scale);
  manager.setAxisAlignedBoundingBox(instance, box);
}

void HybridRenderableManager::setPriority(double entity, double priority) {
  auto [manager, instance] = renderable(entity, "RenderableManager.setPriority()");
  manager.setPriority(instance, static_cast<uint8_t>(requireIndex(priority, 8, "RenderableManager.setPriority()", "priorities")));
}

void HybridRenderableManager::setCulling(double entity, bool enabled) {
  auto [manager, instance] = renderable(entity, "RenderableManager.setCulling()");
  manager.setCulling(instance, enabled);
}

HybridRenderableManager::Renderable HybridRenderableManager::renderable(double entity, const char* method) {
  requireRenderThread(engine_->thread(), method);
  ::filament::RenderableManager& manager = engine_->engine().getRenderableManager();
  return {manager, requireComponent(manager, entity, method, "renderable")};
}

} // namespace margelo::nitro::filament
