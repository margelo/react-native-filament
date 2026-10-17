#pragma once

#include "EngineCore.hpp"
#include "HybridEngineSpec.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine final : public HybridEngineSpec {
public:
  explicit HybridEngine(std::shared_ptr<EngineCore> core);
  ~HybridEngine() override;

  EngineBackend getBackend() override;
  RenderMode getRenderMode() override;
  void setRenderMode(RenderMode renderMode) override;

  std::shared_ptr<Promise<std::shared_ptr<HybridViewTargetSpec>>> createViewTarget(const std::shared_ptr<HybridFilamentViewSpec>& view,
                                                                                   const ViewTargetOptions& options) override;
  void requestFrame() override;
  std::shared_ptr<Promise<void>> shutdown() override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& core() const;

private:
  std::shared_ptr<EngineCore> core_;
};

} // namespace margelo::nitro::filament
