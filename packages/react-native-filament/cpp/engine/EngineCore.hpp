#pragma once

#include "EngineBackend.hpp"
#include "FrameListeners.hpp"
#include "RenderMode.hpp"
#include "resources/ResourceRoot.hpp"
#include "threading/RenderThread.hpp"

#include <NitroModules/Promise.hpp>
#include <filament/Engine.h>
#include <worklets/SharedItems/Serializable.h>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <atomic>
#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <vector>

namespace margelo::nitro::filament {

class ViewTargetCore;

class EngineCore final : public std::enable_shared_from_this<EngineCore> {
public:
  using StartedHandler = std::function<void(const std::shared_ptr<EngineCore>& core, std::exception_ptr error)>;

  static std::shared_ptr<EngineCore> create(EngineBackend backend, StartedHandler onStarted);

  EngineBackend backend() const;
  RenderThread& thread();
  ::filament::Engine& engine();
  bool isLive() const;

  RenderMode renderMode() const;
  void setRenderMode(RenderMode mode);
  void requestFrame();
  void scheduleDemandUpdate();
  void updateDemand();

  void adopt(const std::shared_ptr<Resource>& resource);
  void dispose(const std::shared_ptr<Resource>& resource);

  void addTarget(std::shared_ptr<ViewTargetCore> target);
  void removeTarget(const std::shared_ptr<ViewTargetCore>& target);

  void bindRuntime(std::shared_ptr<worklets::WorkletRuntime> runtime);
  bool hasRuntime() const;
  void runWorklet(const std::shared_ptr<worklets::SerializableWorklet>& worklet);

  std::shared_ptr<FrameListener> addFrameListener(std::function<bool(const FrameInfo&)> callback);
  void removeFrameListener(const std::shared_ptr<FrameListener>& listener);

  std::shared_ptr<Promise<void>> shutdown();

private:
  explicit EngineCore(EngineBackend backend);
  std::shared_ptr<worklets::WorkletRuntime> runtime() const;
  FrameInfo nextFrameInfo(int64_t frameTimeNanos);
  void renderFrame(int64_t frameTimeNanos);
  void shutdownOnRenderThread();

  const EngineBackend backend_;
  std::unique_ptr<RenderThread> thread_;
  ::filament::Engine* engine_ = nullptr;
  std::shared_ptr<ResourceRoot> resources_ = std::make_shared<ResourceRoot>();
  std::vector<std::shared_ptr<ViewTargetCore>> targets_;
  FrameListeners frameListeners_;
  bool listenersWantFrame_ = false;
  bool vsyncEnabled_ = false;
  int64_t lastFrameTimeNanos_ = 0;
  double elapsedSeconds_ = 0;
  double frameIndex_ = 0;
  std::atomic<RenderMode> renderMode_{RenderMode::CONTINUOUS};
  std::atomic<bool> frameRequested_{false};
  std::atomic<bool> demandUpdatePending_{false};
  std::atomic<bool> live_{true};
  mutable std::mutex runtimeMutex_;
  std::shared_ptr<worklets::WorkletRuntime> runtime_;
  std::mutex shutdownMutex_;
  std::shared_ptr<Promise<void>> shutdownPromise_;
};

} // namespace margelo::nitro::filament
