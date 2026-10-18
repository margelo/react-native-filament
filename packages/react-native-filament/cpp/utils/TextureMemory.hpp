#pragma once

#include <filament/Texture.h>

#include <cstddef>

namespace margelo::nitro::filament {

/** Estimated GPU bytes of every level, face and layer of `texture`. */
size_t estimateTextureBytes(const ::filament::Texture& texture);

} // namespace margelo::nitro::filament
