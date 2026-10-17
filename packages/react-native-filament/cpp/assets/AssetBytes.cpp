#include "AssetBytes.hpp"

#include "HybridAssetIOSpec.hpp"
#include "utils/PlatformErrors.hpp"

#include <NitroModules/HybridObjectRegistry.hpp>

#include <stdexcept>

namespace margelo::nitro::filament {

namespace {

  std::shared_ptr<HybridAssetIOSpec> createAssetIO() {
    auto io = std::dynamic_pointer_cast<HybridAssetIOSpec>(HybridObjectRegistry::createHybridObject("AssetIO"));
    if (io == nullptr) {
      throw std::runtime_error("The AssetIO HybridObject is not registered.");
    }
    return io;
  }

} // namespace

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> readAssetBytes(const AssetSource& source) {
  if (const auto* buffer = std::get_if<std::shared_ptr<ArrayBuffer>>(&source)) {
    if ((*buffer)->size() == 0) {
      throw std::invalid_argument("The ArrayBuffer source is empty.");
    }
    return Promise<std::shared_ptr<ArrayBuffer>>::resolved(ArrayBuffer::copy(*buffer));
  }
  auto bytes = Promise<std::shared_ptr<ArrayBuffer>>::create();
  std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> read = createAssetIO()->read(std::get<AssetUri>(source).uri);
  read->addOnResolvedListener([bytes](const std::shared_ptr<ArrayBuffer>& data) { bytes->resolve(data); });
  read->addOnRejectedListener([bytes](const std::exception_ptr& error) { bytes->reject(toPortableError(error)); });
  return bytes;
}

} // namespace margelo::nitro::filament
