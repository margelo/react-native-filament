#include "utils/PlatformErrors.hpp"

namespace margelo::nitro::filament {

std::exception_ptr toPortableError(const std::exception_ptr& error) {
  return error;
}

} // namespace margelo::nitro::filament
