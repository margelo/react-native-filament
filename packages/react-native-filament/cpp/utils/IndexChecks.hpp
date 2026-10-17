#pragma once

#include <cstddef>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

inline size_t requireIndex(double index, size_t count, const char* method, const char* collection) {
  if (index < 0 || index >= static_cast<double>(count) || index != static_cast<double>(static_cast<size_t>(index))) {
    throw std::out_of_range(std::string(method) + " received index " + std::to_string(index) + ", but there are " + std::to_string(count) +
                            " " + collection + ".");
  }
  return static_cast<size_t>(index);
}

} // namespace margelo::nitro::filament
