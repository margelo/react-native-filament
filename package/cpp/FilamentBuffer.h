#pragma once

#include "jsi/HybridObject.h"
#include <cstdint>
#include <stddef.h>

namespace margelo {

class FilamentBuffer : public HybridObject {
public:
  explicit FilamentBuffer(uint8_t* data, size_t size) : _data(data), _size(size) {}

  void loadHybridMethods() override {}

  uint8_t* getData() const {
    return _data;
  }
  size_t getSize() const {
    return _size;
  }

private:
  uint8_t* _data;
  size_t _size;
};
} // namespace margelo