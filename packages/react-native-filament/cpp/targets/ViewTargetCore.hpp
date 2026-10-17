#pragma once

#include "HybridNativeSurfaceSpec.hpp"

#include <filament/Camera.h>
#include <filament/Engine.h>
#include <filament/Renderer.h>
#include <filament/Scene.h>
#include <filament/SwapChain.h>
#include <filament/View.h>
#include <utils/Entity.h>

#include <array>
#include <atomic>
#include <memory>

namespace margelo::nitro::filament {

class ViewTargetCore final {
public:
  ViewTargetCore(::filament::Engine& engine, std::array<float, 4> clearColor);

  void attach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  void resize(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  void detach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  bool canRender() const;
  void render(int64_t frameTimeNanos);
  void destroy();
  void setClearColor(std::array<float, 4> color);

  void revoke();
  double width() const;
  double height() const;

private:
  void destroySwapChain();
  void updateViewport(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);

  ::filament::Engine& engine_;
  ::filament::Renderer* renderer_;
  ::filament::Scene* scene_;
  ::filament::View* view_;
  utils::Entity cameraEntity_;
  ::filament::SwapChain* swapChain_ = nullptr;
  std::shared_ptr<HybridNativeSurfaceSpec> surface_;
  std::atomic<bool> revoked_{false};
  std::atomic<double> width_{0};
  std::atomic<double> height_{0};
};

} // namespace margelo::nitro::filament
