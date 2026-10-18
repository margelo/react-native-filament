#pragma once

#include "EngineCore.hpp"
#include "HybridRenderThreadSpec.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridRenderThread final : public HybridRenderThreadSpec {
public:
  explicit HybridRenderThread(std::shared_ptr<EngineCore> engine) : HybridObject(TAG), engine_(std::move(engine)) {}

  bool getIsCurrentThread() override;
  bool getHasRuntime() override;
  std::shared_ptr<HybridRenderThreadCleanupSpec> retainCleanup(const std::function<void()>& cleanup) override;

protected:
  void loadHybridMethods() override;

private:
  jsi::Value createQueue(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);
  jsi::Value bindRuntime(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);
  jsi::Value bindPooledRuntime(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);
  jsi::Value runAsync(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);

  std::shared_ptr<EngineCore> engine_;
};

} // namespace margelo::nitro::filament
