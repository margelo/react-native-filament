#include "ViewTargetCore.hpp"

#include "scene/CameraCore.hpp"
#include "scene/SceneCore.hpp"

#include <filament/Viewport.h>
#include <utils/EntityManager.h>

namespace margelo::nitro::filament {

ViewTargetCore::ViewTargetCore(::filament::Engine& engine, std::array<float, 4> clearColor)
    : Resource("ViewTarget"), engine_(engine), renderer_(engine.createRenderer()), emptyScene_(engine.createScene()),
      view_(engine.createView()), defaultCameraEntity_(utils::EntityManager::get().create()) {
  view_->setScene(emptyScene_);
  view_->setCamera(engine_.createCamera(defaultCameraEntity_));
  setClearColor(clearColor);
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
  return isLive() && swapChain_ != nullptr && !revoked_ && width_ > 0 && height_ > 0;
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

void ViewTargetCore::setScene(const std::shared_ptr<SceneCore>& scene) {
  auto self = std::static_pointer_cast<ViewTargetCore>(shared_from_this());
  if (scene_ != nullptr) {
    scene_->users().remove(self);
  }
  scene_ = scene;
  if (scene_ != nullptr) {
    scene_->users().add(self);
  }
  view_->setScene(scene_ == nullptr ? emptyScene_ : &scene_->scene());
}

void ViewTargetCore::setCamera(const std::shared_ptr<CameraCore>& camera) {
  auto self = std::static_pointer_cast<ViewTargetCore>(shared_from_this());
  if (camera_ != nullptr) {
    camera_->users().remove(self);
  }
  camera_ = camera;
  if (camera_ != nullptr) {
    camera_->users().add(self);
  }
  view_->setCamera(camera_ == nullptr ? engine_.getCameraComponent(defaultCameraEntity_) : &camera_->camera());
}

void ViewTargetCore::setClearColor(std::array<float, 4> color) {
  renderer_->setClearOptions({.clearColor = {color[0], color[1], color[2], color[3]}, .clear = true, .discard = true});
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

std::function<void()> ViewTargetCore::addResizeListener(std::function<void(double width, double height)> listener) {
  std::function<void()> remove = resizeListeners_.add(listener);
  double width = width_;
  double height = height_;
  if (width > 0 && height > 0) {
    listener(width, height);
  }
  return remove;
}

void ViewTargetCore::destroyNative() {
  resizeListeners_.clear();
  if (surface_ != nullptr) {
    detach(surface_);
  }
  setScene(nullptr);
  setCamera(nullptr);
  engine_.destroyCameraComponent(defaultCameraEntity_);
  utils::EntityManager::get().destroy(defaultCameraEntity_);
  engine_.destroy(view_);
  engine_.destroy(emptyScene_);
  engine_.destroy(renderer_);
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
  double width = surface->getWidth();
  double height = surface->getHeight();
  bool changed = width != width_ || height != height_;
  width_ = width;
  height_ = height;
  view_->setViewport({0, 0, static_cast<uint32_t>(width), static_cast<uint32_t>(height)});
  if (changed && width > 0 && height > 0) {
    resizeListeners_.emit(width, height);
  }
}

} // namespace margelo::nitro::filament
