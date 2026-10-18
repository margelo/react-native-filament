#pragma once

#include "HybridViewSpec.hpp"
#include "engine/EngineCore.hpp"
#include "targets/ViewTargetCore.hpp"

#include <filament/View.h>

#include <memory>

namespace margelo::nitro::filament {

class HybridView final : public HybridViewSpec {
public:
  HybridView(std::shared_ptr<EngineCore> engine, std::shared_ptr<ViewTargetCore> target);

  AntiAliasing getAntiAliasing() override;
  void setAntiAliasing(AntiAliasing antiAliasing) override;
  Dithering getDithering() override;
  void setDithering(Dithering dithering) override;
  bool getPostProcessing() override;
  void setPostProcessing(bool postProcessing) override;
  bool getShadowing() override;
  void setShadowing(bool shadowing) override;
  ShadowType getShadowType() override;
  void setShadowType(ShadowType shadowType) override;
  bool getScreenSpaceRefraction() override;
  void setScreenSpaceRefraction(bool screenSpaceRefraction) override;
  void setAmbientOcclusionOptions(const AmbientOcclusionOptions& options) override;
  void setBloomOptions(const BloomOptions& options) override;
  void setTemporalAntiAliasingOptions(const TemporalAntiAliasingOptions& options) override;
  void setDynamicResolutionOptions(const DynamicResolutionOptions& options) override;
  std::tuple<double, double> projectWorldToScreen(const std::tuple<double, double, double>& position) override;

private:
  ::filament::View& usableView(const char* method);

  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<ViewTargetCore> target_;
};

} // namespace margelo::nitro::filament
