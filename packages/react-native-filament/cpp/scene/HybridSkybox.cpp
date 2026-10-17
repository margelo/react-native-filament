#include "HybridSkybox.hpp"

#include "engine/HybridEngine.hpp"

namespace margelo::nitro::filament {

HybridSkybox::HybridSkybox(std::shared_ptr<HybridEngine> engine, std::shared_ptr<SkyboxCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

void HybridSkybox::dispose() {
  engineCore()->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridSkybox::engineCore() const {
  return engine_->core();
}

const std::shared_ptr<SkyboxCore>& HybridSkybox::core() const {
  return core_;
}

} // namespace margelo::nitro::filament
