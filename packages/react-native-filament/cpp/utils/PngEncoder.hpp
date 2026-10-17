#pragma once

#include <cstdint>
#include <vector>

namespace margelo::nitro::filament {

std::vector<uint8_t> encodePng(const uint8_t* rgba, uint32_t width, uint32_t height);

} // namespace margelo::nitro::filament
