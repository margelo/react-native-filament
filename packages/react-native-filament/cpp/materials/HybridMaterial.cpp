#include "HybridMaterial.hpp"

#include "HybridMaterialInstance.hpp"
#include "MaterialInstanceCore.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

HybridMaterial::HybridMaterial(std::shared_ptr<EngineCore> engine, std::shared_ptr<MaterialCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

std::string HybridMaterial::getMaterialName() {
  return core_->name();
}

std::vector<std::string> HybridMaterial::getParameterNames() {
  return core_->parameterNames();
}

std::shared_ptr<HybridMaterialInstanceSpec> HybridMaterial::getDefaultInstance() {
  requireUsable("Material.defaultInstance");
  return std::make_shared<HybridMaterialInstance>(MaterialInstanceRef(MaterialInstanceRef::Default{.material = core_}));
}

std::shared_ptr<HybridMaterialInstanceSpec> HybridMaterial::createInstance() {
  requireUsable("Material.createInstance()");
  auto instance = std::make_shared<MaterialInstanceCore>(core_);
  core_->adopt(instance);
  return std::make_shared<HybridMaterialInstance>(MaterialInstanceRef(MaterialInstanceRef::Owned{.core = instance}));
}

void HybridMaterial::dispose() {
  engine_->dispose(core_);
}

void HybridMaterial::requireUsable(const char* method) const {
  requireRenderThread(engine_->thread(), method);
  core_->requireLive(method);
}

size_t HybridMaterial::getExternalMemorySize() noexcept {
  return core_->isLive() ? core_->byteSize() : 0;
}

} // namespace margelo::nitro::filament
