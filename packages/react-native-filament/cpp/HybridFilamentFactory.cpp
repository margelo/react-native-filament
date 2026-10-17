#include "HybridFilamentFactory.hpp"

#include "SupportedBackends.hpp"

namespace margelo::nitro::filament {

std::string HybridFilamentFactory::getFilamentVersion() {
  return RNF_FILAMENT_VERSION;
}

std::vector<EngineBackend> HybridFilamentFactory::getSupportedBackends() {
  return supportedBackends();
}

} // namespace margelo::nitro::filament
