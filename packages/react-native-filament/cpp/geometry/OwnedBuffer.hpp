#pragma once

#include <backend/BufferDescriptor.h>

#include <vector>

namespace margelo::nitro::filament {

template <typename T>::filament::backend::BufferDescriptor ownedBuffer(std::vector<T> values) {
  const void* data = values.data();
  size_t size = values.size() * sizeof(T);
  return ::filament::backend::BufferDescriptor::make(data, size, [owned = std::move(values)](const void*, size_t) {});
}

} // namespace margelo::nitro::filament
