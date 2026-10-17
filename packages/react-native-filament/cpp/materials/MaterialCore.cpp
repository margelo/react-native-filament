#include "MaterialCore.hpp"

namespace margelo::nitro::filament {

namespace {

  std::vector<std::string> parameterNamesOf(const ::filament::Material& material) {
    std::vector<::filament::Material::ParameterInfo> parameters(material.getParameterCount());
    material.getParameters(parameters.data(), parameters.size());
    std::vector<std::string> names;
    names.reserve(parameters.size());
    for (const ::filament::Material::ParameterInfo& parameter : parameters) {
      names.emplace_back(parameter.name);
    }
    return names;
  }

} // namespace

MaterialCore::MaterialCore(std::shared_ptr<EngineCore> engine, ::filament::Material* material)
    : Resource("Material"), engine_(std::move(engine)), material_(material), name_(material->getName()),
      parameterNames_(parameterNamesOf(*material)) {}

MaterialCore::~MaterialCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, material = material_] {
      engine->materialAssignments().releaseMaterial(material, engine->engine());
      engine->engine().destroy(material);
    }});
  }
}

const std::shared_ptr<EngineCore>& MaterialCore::engine() const {
  return engine_;
}

::filament::Material& MaterialCore::material() {
  return *material_;
}

const std::string& MaterialCore::name() const {
  return name_;
}

const std::vector<std::string>& MaterialCore::parameterNames() const {
  return parameterNames_;
}

void MaterialCore::destroyNative() {
  engine_->materialAssignments().releaseMaterial(material_, engine_->engine());
  engine_->engine().destroy(material_);
}

} // namespace margelo::nitro::filament
