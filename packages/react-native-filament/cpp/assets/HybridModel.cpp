#include "HybridModel.hpp"

#include "HybridModelInstance.hpp"
#include "engine/HybridEngine.hpp"
#include "utils/IndexChecks.hpp"

namespace margelo::nitro::filament {

HybridModel::HybridModel(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {
  for (size_t i = 0; i < core_->snapshot().instances.size(); i++) {
    instances_.push_back(std::make_shared<HybridModelInstance>(engine_, core_, i));
  }
}

double HybridModel::getRootEntity() {
  return core_->snapshot().rootEntity;
}

std::vector<double> HybridModel::getEntities() {
  return core_->snapshot().entities;
}

Aabb HybridModel::getBoundingBox() {
  return core_->snapshot().boundingBox;
}

double HybridModel::getInstanceCount() {
  return static_cast<double>(instances_.size());
}

std::shared_ptr<HybridModelInstanceSpec> HybridModel::getInstance(double index) {
  return instances_[requireIndex(index, instances_.size(), "Model.getInstance()", "instances")];
}

std::optional<double> HybridModel::getEntityByName(const std::string& name) {
  return core_->snapshot().entityByName(name);
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

} // namespace margelo::nitro::filament
