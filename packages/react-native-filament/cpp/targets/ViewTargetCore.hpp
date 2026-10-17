#pragma once

#include "HybridNativeSurfaceSpec.hpp"
#include "HybridSnapshotSpec.hpp"
#include "PickResult.hpp"
#include "resources/Resource.hpp"
#include "utils/ListenerRegistry.hpp"
#include "utils/OnceEvent.hpp"

#include <filament/Camera.h>
#include <filament/Engine.h>
#include <filament/Renderer.h>
#include <filament/Scene.h>
#include <filament/SwapChain.h>
#include <filament/View.h>
#include <utils/Entity.h>

#include <NitroModules/Promise.hpp>
#include <backend/CallbackHandler.h>

#include <array>
#include <atomic>
#include <cstdint>
#include <memory>
#include <optional>
#include <unordered_map>
#include <vector>

namespace margelo::nitro::filament {

class CameraCore;
class SceneCore;

class ViewTargetCore final : public Resource {
public:
  struct ClearSettings {
    std::array<float, 4> color;
    bool clear;
    bool discard;
  };

  using PickPromise = Promise<std::optional<PickResult>>;
  using SnapshotPromise = Promise<std::shared_ptr<HybridSnapshotSpec>>;

  ViewTargetCore(::filament::Engine& engine, ::filament::backend::CallbackHandler& callbacks, ClearSettings clear);

  void attach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  void resize(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  void detach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);
  bool canRender() const;
  void render(int64_t frameTimeNanos);

  void setScene(const std::shared_ptr<SceneCore>& scene);
  void setCamera(const std::shared_ptr<CameraCore>& camera);
  void setClearOptions(ClearSettings clear);
  ::filament::View& view();
  ::filament::math::float2 projectWorldToPoints(::filament::math::float3 position) const;

  void revoke();
  double width() const;
  double height() const;
  std::function<void()> addResizeListener(std::function<void(double width, double height)> listener);
  std::function<void()> addFirstFrameListener(std::function<void()> listener);
  void pick(double x, double y, std::shared_ptr<PickPromise> promise);
  void completePick(uint64_t id, const ::filament::View::PickingQueryResult& result);
  void takeSnapshot(std::shared_ptr<SnapshotPromise> promise);
  void completeSnapshot(uint64_t id, std::vector<uint8_t>&& pixels, uint32_t width, uint32_t height);

protected:
  void destroyNative() override;

private:
  void destroySwapChain();
  void readRequestedSnapshots();
  void rejectPendingQueries();
  void updateViewport(const std::shared_ptr<HybridNativeSurfaceSpec>& surface);

  ::filament::Engine& engine_;
  ::filament::backend::CallbackHandler& callbacks_;
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
  double contentScale_ = 1;
  ListenerRegistry<double, double> resizeListeners_;
  OnceEvent firstFrame_;
  uint64_t nextQueryId_ = 1;
  std::unordered_map<uint64_t, std::shared_ptr<PickPromise>> pendingPicks_;
  std::unordered_map<uint64_t, std::shared_ptr<SnapshotPromise>> pendingSnapshots_;
  std::vector<uint64_t> requestedSnapshots_;
};

} // namespace margelo::nitro::filament
