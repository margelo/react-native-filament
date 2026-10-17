#pragma once

#include "EngineBackend.hpp"
#include "RenderMode.hpp"
#include "threading/RenderThread.hpp"

#include <NitroModules/Promise.hpp>
#include <filament/Engine.h>

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

  void addTarget(std::shared_ptr<ViewTargetCore> target);
  void removeTarget(const std::shared_ptr<ViewTargetCore>& target);

  std::shared_ptr<Promise<void>> shutdown();

private:
  explicit EngineCore(EngineBackend backend);
  void renderFrame(int64_t frameTimeNanos);
  void shutdownOnRenderThread();

  const EngineBackend backend_;
  std::unique_ptr<RenderThread> thread_;
  ::filament::Engine* engine_ = nullptr;
  std::vector<std::shared_ptr<ViewTargetCore>> targets_;
  std::atomic<RenderMode> renderMode_{RenderMode::CONTINUOUS};
  std::atomic<bool> frameRequested_{false};
  std::atomic<bool> demandUpdatePending_{false};
  std::atomic<bool> live_{true};
  std::mutex shutdownMutex_;
  std::shared_ptr<Promise<void>> shutdownPromise_;
};

} // namespace margelo::nitro::filament
