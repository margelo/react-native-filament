#pragma once

#include "EngineCore.hpp"

#include <worklets/RunLoop/AsyncQueue.h>

#include <memory>
#include <mutex>

namespace margelo::nitro::filament {

/** The queue of a render worklet runtime; it moves to the next Engine when the runtime is reused. */
class RenderThreadQueue final : public worklets::AsyncQueue {
public:
  void target(std::weak_ptr<EngineCore> engine) {
    std::unique_lock lock(mutex_);
    engine_ = std::move(engine);
  }

  std::shared_ptr<EngineCore> engine() {
    std::unique_lock lock(mutex_);
    return engine_.lock();
  }

  void push(std::function<void()>&& job) override {
    if (std::shared_ptr<EngineCore> engine = this->engine()) {
      engine->thread().post({.run = std::move(job)});
    }
  }

private:
  std::mutex mutex_;
  std::weak_ptr<EngineCore> engine_;
};

} // namespace margelo::nitro::filament
