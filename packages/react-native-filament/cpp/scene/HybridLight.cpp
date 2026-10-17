#include "HybridLight.hpp"

#include "engine/HybridEngine.hpp"
#include "utils/EntityConversion.hpp"

namespace margelo::nitro::filament {

HybridLight::HybridLight(std::shared_ptr<HybridEngine> engine, std::shared_ptr<LightCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

double HybridLight::getEntity() {
  return fromEntity(core_->entity());
}

LightType HybridLight::getType() {
  return core_->type();
}

void HybridLight::dispose() {
  engine_->core()->dispose(core_);
}

} // namespace margelo::nitro::filament
