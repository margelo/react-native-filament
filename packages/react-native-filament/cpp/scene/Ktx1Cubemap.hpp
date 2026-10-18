#pragma once

#include <image/Ktx1Bundle.h>

#include <cstddef>
#include <cstdint>
#include <memory>

namespace margelo::nitro::filament {

std::unique_ptr<image::Ktx1Bundle> parseKtx1Cubemap(const uint8_t* ktx, size_t size, const char* purpose);

} // namespace margelo::nitro::filament
