#pragma once

#include "HybridFilamentFactorySpec.hpp"

namespace margelo::nitro::filament {

class HybridFilamentFactory final : public HybridFilamentFactorySpec {
public:
  HybridFilamentFactory() : HybridObject(TAG) {}

  std::string getFilamentVersion() override;
  std::vector<EngineBackend> getSupportedBackends() override;
  std::shared_ptr<Promise<std::shared_ptr<HybridEngineSpec>>> createEngine(const EngineOptions& options) override;
};

} // namespace margelo::nitro::filament
