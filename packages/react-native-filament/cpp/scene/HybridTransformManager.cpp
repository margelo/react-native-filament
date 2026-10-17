#include "HybridTransformManager.hpp"

#include "utils/EntityConversion.hpp"
#include "utils/ThreadChecks.hpp"
#include "utils/TransformChecks.hpp"
#include "utils/Trs.hpp"

#include <algorithm>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

using ::filament::math::float3;
using ::filament::math::mat4f;

HybridTransformManager::HybridTransformManager(std::shared_ptr<EngineCore> engine) : HybridObject(TAG), engine_(std::move(engine)) {}

Mat4Tuple HybridTransformManager::getTransform(double entity) {
  ::filament::TransformManager& tm = transforms("TransformManager.getTransform()");
  return fromMat4f(tm.getTransform(requireTransform(tm, entity, "TransformManager.getTransform()")));
}

Mat4Tuple HybridTransformManager::getWorldTransform(double entity) {
  ::filament::TransformManager& tm = transforms("TransformManager.getWorldTransform()");
  return fromMat4f(tm.getWorldTransform(requireTransform(tm, entity, "TransformManager.getWorldTransform()")));
}

void HybridTransformManager::setTransform(double entity, const Mat4Tuple& transform) {
  ::filament::TransformManager& tm = transforms("TransformManager.setTransform()");
  tm.setTransform(requireTransform(tm, entity, "TransformManager.setTransform()"), toMat4f(transform));
}

void HybridTransformManager::setTranslation(double entity, const std::tuple<double, double, double>& translation) {
  ::filament::TransformManager& tm = transforms("TransformManager.setTranslation()");
  auto instance = requireTransform(tm, entity, "TransformManager.setTranslation()");
  Trs trs = Trs::decompose(tm.getTransform(instance));
  trs.translation = toFloat3(translation);
  tm.setTransform(instance, trs.compose());
}

void HybridTransformManager::setRotation(double entity, const std::tuple<double, double, double, double>& rotation) {
  ::filament::TransformManager& tm = transforms("TransformManager.setRotation()");
  auto instance = requireTransform(tm, entity, "TransformManager.setRotation()");
  Trs trs = Trs::decompose(tm.getTransform(instance));
  trs.rotation = normalize(toQuaternion(rotation));
  tm.setTransform(instance, trs.compose());
}

void HybridTransformManager::setScale(double entity, const std::tuple<double, double, double>& scale) {
  ::filament::TransformManager& tm = transforms("TransformManager.setScale()");
  auto instance = requireTransform(tm, entity, "TransformManager.setScale()");
  Trs trs = Trs::decompose(tm.getTransform(instance));
  trs.scale = toFloat3(scale);
  tm.setTransform(instance, trs.compose());
}

std::optional<double> HybridTransformManager::getParent(double entity) {
  ::filament::TransformManager& tm = transforms("TransformManager.getParent()");
  utils::Entity parent = tm.getParent(requireTransform(tm, entity, "TransformManager.getParent()"));
  if (parent.isNull()) {
    return std::nullopt;
  }
  return fromEntity(parent);
}

void HybridTransformManager::setParent(double entity, std::optional<double> parent) {
  ::filament::TransformManager& tm = transforms("TransformManager.setParent()");
  auto instance = requireTransform(tm, entity, "TransformManager.setParent()");
  auto parentInstance =
      parent.has_value() ? requireTransform(tm, parent.value(), "TransformManager.setParent()") : ::filament::TransformManager::Instance();
  tm.setParent(instance, parentInstance);
}

void HybridTransformManager::transformToUnitCube(double entity, const Aabb& boundingBox) {
  ::filament::TransformManager& tm = transforms("TransformManager.transformToUnitCube()");
  auto instance = requireTransform(tm, entity, "TransformManager.transformToUnitCube()");
  float3 halfExtent = toFloat3(boundingBox.halfExtent);
  float largest = std::max({halfExtent.x, halfExtent.y, halfExtent.z});
  if (!(largest > 0)) {
    throw std::invalid_argument("TransformManager.transformToUnitCube() needs a bounding box with a positive half extent.");
  }
  tm.setTransform(instance, mat4f::scaling(1.0f / largest) * mat4f::translation(-toFloat3(boundingBox.center)));
}

void HybridTransformManager::openLocalTransformTransaction() {
  transforms("TransformManager.openLocalTransformTransaction()").openLocalTransformTransaction();
}

void HybridTransformManager::commitLocalTransformTransaction() {
  transforms("TransformManager.commitLocalTransformTransaction()").commitLocalTransformTransaction();
}

::filament::TransformManager& HybridTransformManager::transforms(const char* method) {
  requireRenderThread(engine_->thread(), method);
  return engine_->engine().getTransformManager();
}

} // namespace margelo::nitro::filament
