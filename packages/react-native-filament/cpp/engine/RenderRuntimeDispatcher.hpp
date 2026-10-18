#pragma once

#include "RenderThreadQueue.hpp"

#include <NitroModules/Dispatcher.hpp>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <memory>
#include <stdexcept>

namespace margelo::nitro::filament {

/** Nitro's dispatcher for a render worklet runtime; it follows the runtime's queue to whichever Engine owns it. */
class RenderRuntimeDispatcher final : public Dispatcher {
public:
  RenderRuntimeDispatcher(std::shared_ptr<RenderThreadQueue> queue, std::weak_ptr<worklets::WorkletRuntime> runtime)
      : queue_(std::move(queue)), runtime_(std::move(runtime)) {}

  void runSync(std::function<void()>&& function) override {
    std::shared_ptr<EngineCore> engine = queue_->engine();
    if (engine == nullptr || !engine->thread().isCurrentThread()) {
      throw std::runtime_error("FilamentThreadError: synchronous work for the render runtime must run on its render thread.");
    }
    function();
  }

  void runAsync(std::function<void()>&& function) override {
    queue_->push([runtime = runtime_, function = std::move(function)] {
      if (std::shared_ptr<worklets::WorkletRuntime> strong = runtime.lock()) {
        strong->runSync([&](jsi::Runtime&) { function(); });
      }
    });
  }

private:
  std::shared_ptr<RenderThreadQueue> queue_;
  std::weak_ptr<worklets::WorkletRuntime> runtime_;
};

} // namespace margelo::nitro::filament
