#include "WorkletRuntimeRegistry.h"

namespace margelo {

std::set<jsi::Runtime*> WorkletRuntimeRegistry::registry_{};
std::mutex WorkletRuntimeRegistry::mutex_{};

} // namespace margelo
