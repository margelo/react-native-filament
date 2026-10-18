#include "HybridIndirectLight.hpp"

#include "engine/HybridEngine.hpp"

namespace margelo::nitro::filament {

HybridIndirectLight::HybridIndirectLight(std::shared_ptr<HybridEngine> engine, std::shared_ptr<IndirectLightCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

void HybridIndirectLight::dispose() {
  engineCore()->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridIndirectLight::engineCore() const {
  return engine_->core();
}

const std::shared_ptr<IndirectLightCore>& HybridIndirectLight::core() const {
  return core_;
}

size_t HybridIndirectLight::getExternalMemorySize() noexcept {
  return core_->isLive() ? core_->byteSize() : 0;
}

} // namespace margelo::nitro::filament
