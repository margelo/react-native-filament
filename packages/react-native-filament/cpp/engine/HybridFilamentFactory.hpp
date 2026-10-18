#pragma once

#include "HybridFilamentFactorySpec.hpp"
#include "RenderRuntimePool.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridFilamentFactory final : public HybridFilamentFactorySpec {
public:
  HybridFilamentFactory() : HybridObject(TAG) {}

  std::string getFilamentVersion() override;
  std::vector<EngineBackend> getSupportedBackends() override;
  std::shared_ptr<Promise<std::shared_ptr<HybridEngineSpec>>> createEngine(const EngineOptions& options) override;

private:
  std::shared_ptr<RenderRuntimePool> runtimes_ = std::make_shared<RenderRuntimePool>();
};

} // namespace margelo::nitro::filament
