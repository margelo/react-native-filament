#pragma once

#include "RNFManagedBuffer.h"
#include "jsi/RNFPointerHolder.h"

namespace margelo {

class FilamentBuffer : public PointerHolder<ManagedBuffer> {
public:
  explicit FilamentBuffer(std::shared_ptr<ManagedBuffer> buffer) : PointerHolder("FilamentBuffer", buffer) {}
  void loadHybridMethods() override {
      PointerHolder::loadHybridMethods();
  }

  std::shared_ptr<ManagedBuffer> getBuffer() {
    return pointee();
  }
};

} // namespace margelo
