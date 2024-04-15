#pragma once

#include "jsi/HybridObject.h"

#include <filament/SwapChain.h>

namespace margelo {
using namespace filament;

class SwapChainWrapper : public HybridObject {
public:
  explicit SwapChainWrapper(std::shared_ptr<SwapChain> swapChain) : HybridObject("SwapChainWrapper"), _swapChain(swapChain) {}

  void loadHybridMethods() override {}

  std::shared_ptr<SwapChain> getSwapChain() {
    return _swapChain;
  }

private:
  std::shared_ptr<SwapChain> _swapChain;
};
} // namespace margelo
