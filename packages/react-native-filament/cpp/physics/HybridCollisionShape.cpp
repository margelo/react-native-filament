#include "HybridCollisionShape.hpp"

#include "BulletConversion.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

std::shared_ptr<HybridCollisionShapeSpec> HybridCollisionShape::of(const std::shared_ptr<EngineCore>& engine,
                                                                   const std::shared_ptr<CollisionShapeCore>& core) {
  if (std::shared_ptr<HybridCollisionShapeSpec> existing = core->hybrid().lock()) {
    return existing;
  }
  auto created = std::make_shared<HybridCollisionShape>(engine, core);
  core->hybrid() = created;
  return created;
}

HybridCollisionShape::HybridCollisionShape(std::shared_ptr<EngineCore> engine, std::shared_ptr<CollisionShapeCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

CollisionShapeType HybridCollisionShape::getType() {
  return core_->type();
}

std::tuple<double, double, double> HybridCollisionShape::getLocalScaling() {
  return fromBtVector3(usable("CollisionShape.localScaling").getLocalScaling());
}

void HybridCollisionShape::setLocalScaling(const std::tuple<double, double, double>& localScaling) {
  usable("CollisionShape.localScaling").setLocalScaling(toBtVector3(localScaling));
}

double HybridCollisionShape::getMargin() {
  return usable("CollisionShape.margin").getMargin();
}

void HybridCollisionShape::setMargin(double margin) {
  usable("CollisionShape.margin").setMargin(static_cast<btScalar>(margin));
}

void HybridCollisionShape::dispose() {
  engine_->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridCollisionShape::engineCore() const {
  return engine_;
}

const std::shared_ptr<CollisionShapeCore>& HybridCollisionShape::core() const {
  return core_;
}

btCollisionShape& HybridCollisionShape::usable(const char* method) {
  requireRenderThread(engine_->thread(), method);
  core_->requireLive(method);
  return core_->shape();
}

} // namespace margelo::nitro::filament
