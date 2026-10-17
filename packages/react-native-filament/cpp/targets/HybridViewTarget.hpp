#pragma once

#include "HybridFilamentViewSpec.hpp"
#include "HybridViewTargetSpec.hpp"
#include "ViewTargetCore.hpp"

#include <atomic>
#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;
class EngineCore;

class HybridViewTarget final : public HybridViewTargetSpec {
public:
  HybridViewTarget(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ViewTargetCore> core,
                   std::shared_ptr<HybridFilamentViewSpec> view);
  ~HybridViewTarget() override;

  double getWidth() override;
  double getHeight() override;
  ListenerSubscription addOnResizeListener(const std::function<void(double width, double height)>& listener) override;
  void setScene(const std::shared_ptr<HybridSceneSpec>& scene) override;
  void setCamera(const std::shared_ptr<HybridCameraSpec>& camera) override;
  void setClearColor(const std::tuple<double, double, double, double>& color) override;
  void dispose() override;

private:
  static SurfaceObserver makeSurfaceObserver(std::weak_ptr<EngineCore> engine, std::weak_ptr<ViewTargetCore> target);

  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<ViewTargetCore> core_;
  std::shared_ptr<HybridFilamentViewSpec> view_;
  std::atomic<bool> disposed_{false};
};

} // namespace margelo::nitro::filament
