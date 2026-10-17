#pragma once

#include "EngineCore.hpp"

#include <NitroModules/Dispatcher.hpp>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <memory>
#include <stdexcept>

namespace margelo::nitro::filament {

class RenderRuntimeDispatcher final : public Dispatcher {
public:
  RenderRuntimeDispatcher(std::weak_ptr<EngineCore> engine, std::weak_ptr<worklets::WorkletRuntime> runtime)
      : engine_(std::move(engine)), runtime_(std::move(runtime)) {}

  void runSync(std::function<void()>&& function) override {
    std::shared_ptr<EngineCore> engine = engine_.lock();
    if (engine == nullptr || !engine->thread().isCurrentThread()) {
      throw std::runtime_error("FilamentThreadError: synchronous work for the render runtime must run on its render thread.");
    }
    function();
  }

  void runAsync(std::function<void()>&& function) override {
    std::shared_ptr<EngineCore> engine = engine_.lock();
    if (engine == nullptr) {
      return;
    }
    engine->thread().post({.run = [runtime = runtime_, function = std::move(function)] {
      if (std::shared_ptr<worklets::WorkletRuntime> strong = runtime.lock()) {
        strong->runSync([&](jsi::Runtime&) { function(); });
      }
    }});
  }

private:
  std::weak_ptr<EngineCore> engine_;
  std::weak_ptr<worklets::WorkletRuntime> runtime_;
};

} // namespace margelo::nitro::filament
