#include "HybridRenderable.hpp"

#include "engine/HybridEngine.hpp"
#include "utils/EntityConversion.hpp"

namespace margelo::nitro::filament {

HybridRenderable::HybridRenderable(std::shared_ptr<HybridEngine> engine, std::shared_ptr<GeometryCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

double HybridRenderable::getEntity() {
  return fromEntity(core_->entity());
}

void HybridRenderable::dispose() {
  engine_->core()->dispose(core_);
}

} // namespace margelo::nitro::filament
