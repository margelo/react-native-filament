#include "ViewTargetCore.hpp"

#include <filament/Viewport.h>
#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

ViewTargetCore::ViewTargetCore(::filament::Engine& engine, std::array<float, 4> clearColor)
    : engine_(engine), renderer_(engine.createRenderer()), scene_(engine.createScene()), view_(engine.createView()),
      cameraEntity_(utils::EntityManager::get().create()) {
  ::filament::Camera* camera = engine_.createCamera(cameraEntity_);
  view_->setScene(scene_);
  view_->setCamera(camera);
  renderer_->setClearOptions({.clearColor = {clearColor[0], clearColor[1], clearColor[2], clearColor[3]}, .clear = true, .discard = true});
}

void ViewTargetCore::attach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  if (surface_ != nullptr) {
    detach(surface_);
  }
  uint64_t flags = surface->getTransparent() ? ::filament::SwapChain::CONFIG_TRANSPARENT : 0;
  swapChain_ = engine_.createSwapChain(reinterpret_cast<void*>(surface->getHandle()), flags);
  surface_ = surface;
  revoked_ = false;
  updateViewport(surface);
}

void ViewTargetCore::resize(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  if (surface == surface_) {
    updateViewport(surface);
  }
}

void ViewTargetCore::detach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  if (surface != surface_) {
    return;
  }
  destroySwapChain();
  surface_->release();
  surface_ = nullptr;
  width_ = 0;
  height_ = 0;
}

bool ViewTargetCore::canRender() const {
  return swapChain_ != nullptr && !revoked_ && width_ > 0 && height_ > 0;
}

void ViewTargetCore::render(int64_t frameTimeNanos) {
  if (!canRender()) {
    return;
  }
  if (renderer_->beginFrame(swapChain_, static_cast<uint64_t>(frameTimeNanos))) {
    renderer_->render(view_);
    renderer_->endFrame();
  }
}

void ViewTargetCore::destroy() {
  if (surface_ != nullptr) {
    detach(surface_);
  }
  ::filament::Camera* camera = engine_.getCameraComponent(cameraEntity_);
  if (camera != nullptr) {
    engine_.destroyCameraComponent(cameraEntity_);
  }
  utils::EntityManager::get().destroy(cameraEntity_);
  engine_.destroy(view_);
  engine_.destroy(scene_);
  engine_.destroy(renderer_);
}

void ViewTargetCore::revoke() {
  revoked_ = true;
}

double ViewTargetCore::width() const {
  return width_;
}

double ViewTargetCore::height() const {
  return height_;
}

void ViewTargetCore::destroySwapChain() {
  if (swapChain_ == nullptr) {
    return;
  }
  engine_.destroy(swapChain_);
  engine_.flushAndWait();
  swapChain_ = nullptr;
}

void ViewTargetCore::updateViewport(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  width_ = surface->getWidth();
  height_ = surface->getHeight();
  view_->setViewport({0, 0, static_cast<uint32_t>(width_), static_cast<uint32_t>(height_)});
}

} // namespace margelo::nitro::filament
