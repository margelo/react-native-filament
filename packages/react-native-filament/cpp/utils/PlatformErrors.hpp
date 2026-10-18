#pragma once

#include <exception>

namespace margelo::nitro::filament {

std::exception_ptr toPortableError(const std::exception_ptr& error);

} // namespace margelo::nitro::filament
