#include "MaterialFile.hpp"

#include <filament/MaterialEnums.h>

#include <cstring>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

namespace {

  constexpr char kVersionChunkTag[] = "SREV_TAM";
  constexpr size_t kVersionOffset = 12;

} // namespace

void requireMaterialFile(const uint8_t* bytes, size_t size) {
  if (size < kVersionOffset + sizeof(uint32_t) || std::memcmp(bytes, kVersionChunkTag, 8) != 0) {
    throw std::invalid_argument("FilamentAssetError: The source is not a compiled Filament material (.filamat).");
  }
  uint32_t version = 0;
  std::memcpy(&version, bytes + kVersionOffset, sizeof(version));
  if (version != ::filament::MATERIAL_VERSION) {
    throw std::invalid_argument("FilamentAssetError: The material was compiled for material version " + std::to_string(version) +
                                ", but Filament " RNF_FILAMENT_VERSION " needs version " + std::to_string(::filament::MATERIAL_VERSION) +
                                ". Recompile it with matc " RNF_FILAMENT_VERSION ".");
  }
}

} // namespace margelo::nitro::filament
