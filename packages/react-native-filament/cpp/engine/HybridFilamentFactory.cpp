#include "HybridFilamentFactory.hpp"

#include "BackendConversion.hpp"
#include "EngineCore.hpp"
#include "HybridEngine.hpp"
#include "SupportedBackends.hpp"

#include <algorithm>
#include <stdexcept>

namespace margelo::nitro::filament {

std::string HybridFilamentFactory::getFilamentVersion() {
  return RNF_FILAMENT_VERSION;
}

std::vector<EngineBackend> HybridFilamentFactory::getSupportedBackends() {
  return supportedBackends();
}

std::shared_ptr<Promise<std::shared_ptr<HybridEngineSpec>>> HybridFilamentFactory::createEngine(const EngineOptions& options) {
  std::vector<EngineBackend> supported = supportedBackends();
  EngineBackend backend = options.backend.value_or(supported.front());
  if (std::find(supported.begin(), supported.end(), backend) == supported.end()) {
    return Promise<std::shared_ptr<HybridEngineSpec>>::rejected(
        std::make_exception_ptr(std::invalid_argument("The backend \"" + backendName(backend) + "\" is not supported on this device.")));
  }
  auto promise = Promise<std::shared_ptr<HybridEngineSpec>>::create();
  EngineCore::create(backend, runtimes_, [promise](const std::shared_ptr<EngineCore>& core, std::exception_ptr error) {
    if (error != nullptr) {
      promise->reject(error);
      return;
    }
    promise->resolve(std::make_shared<HybridEngine>(core));
  });
  return promise;
}

} // namespace margelo::nitro::filament
