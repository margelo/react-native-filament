#include "Ktx1Cubemap.hpp"

#include <algorithm>
#include <array>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

namespace {

  constexpr std::array<uint8_t, 12> kKtx1Identifier = {0xAB, 'K', 'T', 'X', ' ', '1', '1', 0xBB, '\r', '\n', 0x1A, '\n'};
  constexpr size_t kKtx1HeaderSize = 64;

} // namespace

std::unique_ptr<image::Ktx1Bundle> parseKtx1Cubemap(const uint8_t* ktx, size_t size, const char* purpose) {
  if (size < kKtx1HeaderSize || size > UINT32_MAX || !std::equal(kKtx1Identifier.begin(), kKtx1Identifier.end(), ktx)) {
    throw std::invalid_argument(std::string("FilamentAssetError: The ") + purpose + " source is not a KTX1 file.");
  }
  auto bundle = std::make_unique<image::Ktx1Bundle>(ktx, static_cast<uint32_t>(size));
  if (!bundle->isCubemap()) {
    throw std::invalid_argument(std::string("FilamentAssetError: The ") + purpose + " source is not a cubemap.");
  }
  return bundle;
}

} // namespace margelo::nitro::filament
