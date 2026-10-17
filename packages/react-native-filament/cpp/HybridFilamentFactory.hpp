#pragma once

#include "HybridFilamentFactorySpec.hpp"

namespace margelo::nitro::filament {

class HybridFilamentFactory final : public HybridFilamentFactorySpec {
public:
  HybridFilamentFactory() : HybridObject(TAG) {}

  std::string getFilamentVersion() override;
  std::vector<EngineBackend> getSupportedBackends() override;
};

} // namespace margelo::nitro::filament
