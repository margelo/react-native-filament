#pragma once

#include "HybridSwapChainSpec.hpp"

#include <filament/SwapChain.h>

namespace margelo {
using namespace filament;
using namespace nitro::RNF;

class SwapChainWrapper : public HybridSwapChainSpec {
public:
    explicit SwapChainWrapper(std::shared_ptr<SwapChain> swapChain) : _swapChain(swapChain) {}

    std::shared_ptr<SwapChain> getSwapChain() {
        return _swapChain;
    }
    
    size_t getExternalMemorySize() noexcept override {
        return sizeof(std::shared_ptr<SwapChain>);
    }
    
private:
    std::shared_ptr<SwapChain> _swapChain;
};
} // namespace margelo
