#include "ViewHost.hpp"

#include "scene/CameraCore.hpp"
#include "scene/SceneCore.hpp"

#include <filament/Camera.h>
#include <filament/Viewport.h>
#include <utils/EntityManager.h>

#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

namespace margelo::nitro::filament {

ViewHost::ViewHost(const char* kind, ::filament::Engine& engine, ::filament::Renderer& renderer, ClearSettings clear)
    : Resource(kind), engine_(engine), renderer_(&renderer), view_(engine.createView()), emptyScene_(engine.createScene()),
      defaultCameraEntity_(utils::EntityManager::get().create()) {
  view_->setScene(emptyScene_);
  view_->setCamera(engine_.createCamera(defaultCameraEntity_));
#if defined(TARGET_OS_SIMULATOR) && TARGET_OS_SIMULATOR
  // The simulator's Metal reports every PCF depth comparison as shadowed (D34).
  view_->setShadowType(::filament::ShadowType::VSM);
#endif
  setClearOptions(clear);
}

void ViewHost::setScene(const std::shared_ptr<SceneCore>& scene) {
  auto self = std::static_pointer_cast<ViewHost>(shared_from_this());
  if (scene_ != nullptr) {
    scene_->users().remove(self);
  }
  scene_ = scene;
  if (scene_ != nullptr) {
    scene_->users().add(self);
  }
  view_->setScene(scene_ == nullptr ? emptyScene_ : &scene_->scene());
}

void ViewHost::setCamera(const std::shared_ptr<CameraCore>& camera) {
  auto self = std::static_pointer_cast<ViewHost>(shared_from_this());
  if (camera_ != nullptr) {
    camera_->users().remove(self);
  }
  camera_ = camera;
  if (camera_ != nullptr) {
    camera_->users().add(self);
  }
  view_->setCamera(camera_ == nullptr ? engine_.getCameraComponent(defaultCameraEntity_) : &camera_->camera());
}

void ViewHost::setClearOptions(ClearSettings clear) {
  clearOptions_ = {
      .clearColor = {clear.color[0], clear.color[1], clear.color[2], clear.color[3]}, .clear = clear.clear, .discard = clear.discard};
}

void ViewHost::beginFrame(::filament::SwapChain* swapChain, uint64_t vsyncNanos) {
  renderer_->setClearOptions(clearOptions_);
  renderer_->beginFrame(swapChain, vsyncNanos);
}

::filament::View& ViewHost::view() {
  return *view_;
}

::filament::math::float2 ViewHost::projectWorldToPoints(::filament::math::float3 position) const {
  const ::filament::Camera& camera = view_->getCamera();
  ::filament::math::double4 clip = camera.getProjectionMatrix() * camera.getViewMatrix() * ::filament::math::double4(position, 1.0);
  ::filament::math::double2 ndc = clip.xy / clip.w;
  const ::filament::Viewport& viewport = view_->getViewport();
  double x = (ndc.x * 0.5 + 0.5) * viewport.width * pointsPerPixel();
  double y = (0.5 - ndc.y * 0.5) * viewport.height * pointsPerPixel();
  return {static_cast<float>(x), static_cast<float>(y)};
}

double ViewHost::pointsPerPixel() const {
  return 1;
}

void ViewHost::destroyViewHost() {
  setScene(nullptr);
  setCamera(nullptr);
  engine_.destroyCameraComponent(defaultCameraEntity_);
  utils::EntityManager::get().destroy(defaultCameraEntity_);
  engine_.destroy(view_);
  engine_.destroy(emptyScene_);
}

// Filament's Vulkan backend frees destroyed swap chains, and disconnects their windows, only when a frame ends.
void ViewHost::destroyWindowSwapChain(::filament::SwapChain* swapChain) {
  engine_.destroy(swapChain);
  if (engine_.getBackend() != ::filament::Engine::Backend::VULKAN) {
    return;
  }
  ::filament::SwapChain* headless = engine_.createSwapChain(1, 1, 0);
  renderer_->beginFrame(headless);
  renderer_->endFrame();
  engine_.destroy(headless);
}

} // namespace margelo::nitro::filament
