#pragma once

#include "jsi/PointerHolder.h"

#include <filament/SwapChain.h>

namespace margelo {
using namespace filament;

class SwapChainWrapper : public PointerHolder<SwapChain> {
public:
  explicit SwapChainWrapper(std::shared_ptr<SwapChain> swapChain) : PointerHolder("SwapChainWrapper", swapChain) {}

  void loadHybridMethods() override {}

  std::shared_ptr<SwapChain> getSwapChain() {
    return pointee();
  }
};
} // namespace margelo
