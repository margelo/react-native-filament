#pragma once

#include "RNFManagedBuffer.h"
#include "jsi/RNFHybridPointerHolder.h"

namespace margelo {

class FilamentBuffer : public HybridPointerHolder<ManagedBuffer> {
public:
  explicit FilamentBuffer(std::shared_ptr<ManagedBuffer> buffer) : HybridPointerHolder("FilamentBuffer", buffer) {}

  std::shared_ptr<ManagedBuffer> getBuffer() {
    return pointee();
  }
};

} // namespace margelo
