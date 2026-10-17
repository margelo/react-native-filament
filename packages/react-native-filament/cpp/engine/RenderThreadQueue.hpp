#pragma once

#include "EngineCore.hpp"

#include <worklets/RunLoop/AsyncQueue.h>

#include <memory>

namespace margelo::nitro::filament {

class RenderThreadQueue final : public worklets::AsyncQueue {
public:
  explicit RenderThreadQueue(std::weak_ptr<EngineCore> engine) : engine_(std::move(engine)) {}

  void push(std::function<void()>&& job) override {
    if (std::shared_ptr<EngineCore> engine = engine_.lock()) {
      engine->thread().post({.run = std::move(job)});
    }
  }

private:
  std::weak_ptr<EngineCore> engine_;
};

} // namespace margelo::nitro::filament
