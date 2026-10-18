#include "HybridModel.hpp"

#include "HybridModelInstance.hpp"
#include "engine/HybridEngine.hpp"
#include "utils/EntityConversion.hpp"
#include "utils/IndexChecks.hpp"
#include "utils/ThreadChecks.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

HybridModel::HybridModel(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

double HybridModel::getRootEntity() {
  return core_->snapshot().rootEntity;
}

std::vector<double> HybridModel::getEntities() {
  return core_->entities();
}

Aabb HybridModel::getBoundingBox() {
  return core_->snapshot().boundingBox;
}

double HybridModel::getInstanceCount() {
  return static_cast<double>(core_->instanceCount());
}

std::shared_ptr<HybridModelInstanceSpec> HybridModel::getInstance(double index) {
  return instanceAt(requireIndex(index, core_->instanceCount(), "Model.getInstance()", "instances"));
}

std::shared_ptr<HybridModelInstanceSpec> HybridModel::createInstance() {
  requireRenderThread(engineCore()->thread(), "Model.createInstance()");
  core_->requireLive("Model.createInstance()");
  return instanceAt(core_->createInstance());
}

std::vector<std::string> HybridModel::getMorphTargetNames(double entity) {
  requireRenderThread(engineCore()->thread(), "Model.getMorphTargetNames()");
  core_->requireLive("Model.getMorphTargetNames()");
  ::filament::gltfio::FilamentAsset& asset = core_->asset();
  utils::Entity resolved = toEntity(entity);
  std::vector<std::string> names;
  for (size_t i = 0; i < asset.getMorphTargetCountAt(resolved); i++) {
    const char* name = asset.getMorphTargetNameAt(resolved, i);
    names.emplace_back(name == nullptr ? "" : name);
  }
  return names;
}

std::optional<double> HybridModel::getEntityByName(const std::string& name) {
  return core_->snapshot().entityByName(name);
}

std::optional<std::string> HybridModel::getEntityName(double entity) {
  requireRenderThread(engineCore()->thread(), "Model.getEntityName()");
  core_->requireLive("Model.getEntityName()");
  const char* name = core_->asset().getName(toEntity(entity));
  if (name == nullptr) {
    return std::nullopt;
  }
  return std::string(name);
}

void HybridModel::dispose() {
  engineCore()->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridModel::engineCore() const {
  return engine_->core();
}

const std::shared_ptr<ModelCore>& HybridModel::core() const {
  return core_;
}

std::shared_ptr<HybridModelInstanceSpec> HybridModel::instanceAt(size_t index) {
  std::unique_lock lock(instancesMutex_);
  while (instances_.size() <= index) {
    size_t next = instances_.size();
    instances_.push_back(std::make_shared<HybridModelInstance>(engine_, core_, next, core_->instanceSnapshot(next)));
  }
  return instances_[index];
}

size_t HybridModel::getExternalMemorySize() noexcept {
  return core_->isLive() ? core_->byteSize() : 0;
}

} // namespace margelo::nitro::filament
