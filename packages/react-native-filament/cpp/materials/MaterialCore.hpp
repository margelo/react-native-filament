#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"

#include <filament/Material.h>

#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::filament {

class MaterialCore final : public Resource {
public:
  MaterialCore(std::shared_ptr<EngineCore> engine, ::filament::Material* material);
  ~MaterialCore() override;

  const std::shared_ptr<EngineCore>& engine() const;
  ::filament::Material& material();
  const std::string& name() const;
  const std::vector<std::string>& parameterNames() const;

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::Material* material_;
  const std::string name_;
  const std::vector<std::string> parameterNames_;
};

} // namespace margelo::nitro::filament
