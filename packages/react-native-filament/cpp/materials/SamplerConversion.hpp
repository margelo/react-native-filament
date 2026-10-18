#pragma once

#include "SamplerOptions.hpp"

#include <filament/TextureSampler.h>

namespace margelo::nitro::filament {

::filament::TextureSampler toTextureSampler(const SamplerOptions& options);

} // namespace margelo::nitro::filament
