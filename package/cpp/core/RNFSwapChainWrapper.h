#pragma once

#include "HybridSwapChainSpec.hpp"
#include "jsi/RNFHybridPointerHolder.h"

#include <filament/SwapChain.h>

namespace margelo {
using namespace filament;
using namespace nitro::RNF;

class SwapChainWrapper : public HybridSwapChainSpec, public HybridPointerHolder<SwapChain>  {
public:
    explicit SwapChainWrapper(std::shared_ptr<SwapChain> swapChain) : HybridPointerHolder("SwapChain", swapChain) {}

    std::shared_ptr<SwapChain> getSwapChain() {
        return pointee();
    }
    
protected:
    void loadHybridMethods() override {
        // Calling the load hybrid method from the SapChainSpec, as that one already extended HybridPointerHolder
        HybridSwapChainSpec::loadHybridMethods();
    }
};
} // namespace margelo
