#pragma once

#include "ManagedBuffer.h"
#include "jsi/PointerHolder.h"

namespace margelo {

class FilamentBuffer : public PointerHolder<ManagedBuffer> {
public:
  explicit FilamentBuffer(std::shared_ptr<ManagedBuffer> buffer) : PointerHolder("FilamentBuffer", buffer) {}
  void loadHybridMethods() override {}

  std::shared_ptr<ManagedBuffer> getBuffer() {
    return pointee();
  }
};

} // namespace margelo
