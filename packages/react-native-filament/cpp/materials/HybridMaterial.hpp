#pragma once

#include "HybridMaterialSpec.hpp"
#include "MaterialCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridMaterial final : public HybridMaterialSpec {
public:
  HybridMaterial(std::shared_ptr<EngineCore> engine, std::shared_ptr<MaterialCore> core);

  std::string getMaterialName() override;
  std::vector<std::string> getParameterNames() override;
  std::shared_ptr<HybridMaterialInstanceSpec> getDefaultInstance() override;
  std::shared_ptr<HybridMaterialInstanceSpec> createInstance() override;
  void dispose() override;

private:
  void requireUsable(const char* method) const;

  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<MaterialCore> core_;
};

} // namespace margelo::nitro::filament
