#include "MaterialInstanceCore.hpp"

namespace margelo::nitro::filament {

MaterialInstanceCore::MaterialInstanceCore(std::shared_ptr<MaterialCore> material)
    : Resource("MaterialInstance"), material_(std::move(material)), instance_(material_->material().createInstance()) {}

MaterialInstanceCore::~MaterialInstanceCore() {
  if (!isDestroyed()) {
    material_->engine()->thread().post({.run = [material = material_, instance = instance_] {
      material->engine()->materialAssignments().releaseInstance(instance, material->material().getDefaultInstance(),
                                                                material->engine()->engine());
      material->engine()->engine().destroy(instance);
    }});
  }
}

const std::shared_ptr<MaterialCore>& MaterialInstanceCore::material() const {
  return material_;
}

::filament::MaterialInstance& MaterialInstanceCore::instance() {
  return *instance_;
}

void MaterialInstanceCore::destroyNative() {
  EngineCore& engine = *material_->engine();
  engine.materialAssignments().releaseInstance(instance_, material_->material().getDefaultInstance(), engine.engine());
  engine.engine().destroy(instance_);
}

} // namespace margelo::nitro::filament
