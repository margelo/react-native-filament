#include "DebugLineMaterial.hpp"

#include "DebugLineMaterialPackage.hpp"

namespace margelo::nitro::filament {

std::shared_ptr<MaterialCore> createDebugLineMaterial(std::shared_ptr<EngineCore> engine) {
  ::filament::Material* material =
      ::filament::Material::Builder().package(kDebugLineMaterialPackage, sizeof(kDebugLineMaterialPackage)).build(engine->engine());
  auto core = std::make_shared<MaterialCore>(engine, material, sizeof(kDebugLineMaterialPackage));
  engine->adopt(core);
  return core;
}

} // namespace margelo::nitro::filament
