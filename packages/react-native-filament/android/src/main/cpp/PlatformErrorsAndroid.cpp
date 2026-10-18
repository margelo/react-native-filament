#include "utils/PlatformErrors.hpp"

#include <fbjni/fbjni.h>

#include <stdexcept>

namespace margelo::nitro::filament {

std::exception_ptr toPortableError(const std::exception_ptr& error) {
  try {
    std::rethrow_exception(error);
  } catch (const facebook::jni::JniException& exception) {
    return std::make_exception_ptr(std::runtime_error(exception.what()));
  } catch (...) {
    return error;
  }
}

} // namespace margelo::nitro::filament
