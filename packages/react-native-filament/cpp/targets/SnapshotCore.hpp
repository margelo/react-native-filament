#pragma once

#include <cstdint>
#include <vector>

namespace margelo::nitro::filament {

struct SnapshotCore {
  uint32_t width;
  uint32_t height;
  std::vector<uint8_t> rgba;
};

} // namespace margelo::nitro::filament
