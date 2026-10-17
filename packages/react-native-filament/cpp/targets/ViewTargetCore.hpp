#pragma once

#include "HybridNativeSurfaceSpec.hpp"
#include "resources/Resource.hpp"
#include "utils/ListenerRegistry.hpp"

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

class CameraCore;
class SceneCore;

class ViewTargetCore final : public Resource {
public:
  ViewTargetCore(::filament::Engine& engine, std::array<float, 4> clearColor);

  void attach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  void resize(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  void detach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  bool canRender() const;
  void render(int64_t frameTimeNanos);

  void setScene(const std::shared_ptr<SceneCore>& scene);
  void setCamera(const std::shared_ptr<CameraCore>& camera);
  void setClearColor(std::array<float, 4> color);

  void revoke();
  double width() const;
  double height() const;
  std::function<void()> addResizeListener(std::function<void(double width, double height)> listener);

protected:
  void destroyNative() override;

private:
  void destroySwapChain();
  void updateViewport(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);

  ::filament::Engine& engine_;
  ::filament::Renderer* renderer_;
  ::filament::Scene* emptyScene_;
  ::filament::View* view_;
  utils::Entity defaultCameraEntity_;
  ::filament::SwapChain* swapChain_ = nullptr;
  std::shared_ptr<HybridNativeSurfaceSpec> surface_;
  std::shared_ptr<SceneCore> scene_;
  std::shared_ptr<CameraCore> camera_;
  std::atomic<bool> revoked_{false};
  std::atomic<double> width_{0};
  std::atomic<double> height_{0};
  ListenerRegistry<double, double> resizeListeners_;
};

} // namespace margelo::nitro::filament
