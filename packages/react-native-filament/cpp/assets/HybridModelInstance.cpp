#include "HybridModelInstance.hpp"

#include "HybridAnimator.hpp"
#include "SkeletonFollower.hpp"
#include "utils/EngineChecks.hpp"
#include "utils/EntityConversion.hpp"
#include "utils/IndexChecks.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

HybridModelInstance::HybridModelInstance(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core, size_t index,
                                         std::shared_ptr<const ModelInstanceSnapshot> snapshot)
    : HybridObject(TAG), core_(core), index_(index), snapshot_(snapshot),
      animator_(std::make_shared<HybridAnimator>(std::move(engine), std::move(core), index, std::move(snapshot))) {}

double HybridModelInstance::getRootEntity() {
  return snapshot_->rootEntity;
}

std::vector<double> HybridModelInstance::getEntities() {
  return snapshot_->entities;
}

std::shared_ptr<HybridAnimatorSpec> HybridModelInstance::getAnimator() {
  return animator_;
}

std::vector<std::string> HybridModelInstance::getMaterialVariants() {
  return snapshot_->materialVariants;
}

double HybridModelInstance::getSkinCount() {
  return static_cast<double>(snapshot_->skinCount);
}

void HybridModelInstance::applyMaterialVariant(double index) {
  ::filament::gltfio::FilamentInstance& instance = usable("ModelInstance.applyMaterialVariant()");
  instance.applyMaterialVariant(
      requireIndex(index, snapshot_->materialVariants.size(), "ModelInstance.applyMaterialVariant()", "material variants"));
}

void HybridModelInstance::attachSkin(double skinIndex, double target) {
  ::filament::gltfio::FilamentInstance& instance = usable("ModelInstance.attachSkin()");
  instance.attachSkin(requireIndex(skinIndex, snapshot_->skinCount, "ModelInstance.attachSkin()", "skins"), toEntity(target));
}

void HybridModelInstance::detachSkin(double skinIndex, double target) {
  ::filament::gltfio::FilamentInstance& instance = usable("ModelInstance.detachSkin()");
  instance.detachSkin(requireIndex(skinIndex, snapshot_->skinCount, "ModelInstance.detachSkin()", "skins"), toEntity(target));
}

void HybridModelInstance::followSkeleton(const std::optional<std::shared_ptr<HybridModelInstanceSpec>>& source) {
  usable("ModelInstance.followSkeleton()");
  if (!source.has_value()) {
    core_->setSkeletonFollower(index_, nullptr);
    return;
  }
  auto resolved = requireSameEngine<HybridModelInstance>(source.value(), *core_->engine(), "ModelInstance.followSkeleton()");
  resolved->core()->requireLive("ModelInstance.followSkeleton()");
  auto follower = std::make_shared<SkeletonFollower>(resolved->core(), resolved->index(), core_, index_);
  core_->engine()->addSkeletonFollower(follower);
  core_->setSkeletonFollower(index_, follower);
}

void HybridModelInstance::recomputeBoundingBoxes() {
  usable("ModelInstance.recomputeBoundingBoxes()").recomputeBoundingBoxes();
}

const std::shared_ptr<EngineCore>& HybridModelInstance::engineCore() const {
  return core_->engine();
}

const std::shared_ptr<ModelCore>& HybridModelInstance::core() const {
  return core_;
}

size_t HybridModelInstance::index() const {
  return index_;
}

::filament::gltfio::FilamentInstance& HybridModelInstance::usable(const char* method) {
  requireRenderThread(core_->engine()->thread(), method);
  core_->requireLive(method);
  return core_->instance(index_);
}

} // namespace margelo::nitro::filament
