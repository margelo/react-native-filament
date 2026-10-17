#include "RNFWorkletRuntimeRegistry.h"

namespace margelo {

std::set<jsi::Runtime*> RNFWorkletRuntimeRegistry::registry_{};
std::mutex RNFWorkletRuntimeRegistry::mutex_{};

} // namespace margelo
