#pragma once

#include "EngineCore.hpp"
#include "HybridFrameListenerSubscriptionSpec.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridFrameListenerSubscription final : public HybridFrameListenerSubscriptionSpec {
public:
  HybridFrameListenerSubscription(std::weak_ptr<EngineCore> engine, std::weak_ptr<FrameListener> listener)
      : HybridObject(TAG), engine_(std::move(engine)), listener_(std::move(listener)) {}

  void remove() override;

private:
  std::weak_ptr<EngineCore> engine_;
  std::weak_ptr<FrameListener> listener_;
};

} // namespace margelo::nitro::filament
