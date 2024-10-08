#pragma once

#include "HybridSwapChainSpec.hpp"
#include "jsi/RNFHybridPointerHolder.h"

#include <filament/SwapChain.h>

namespace margelo {
using namespace filament;
using namespace nitro::RNF;

class SwapChainWrapper : public HybridPointerHolder<SwapChain> {
public:
    explicit SwapChainWrapper(std::shared_ptr<SwapChain> swapChain) : HybridSwapChainSpec() {}

    std::shared_ptr<SwapChain> getSwapChain() {
        return pointee();
    }
    
    bool getIsValid() override {
        return PointerHolderNitro::getIsValid();
    }
    
    void release() override {
        PointerHolderNitro::release();
    }
};
} // namespace margelo
